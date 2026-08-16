"""Entry point for the ai-vision (Member 1) pipeline.

CCTV video -> frame extraction -> preprocessing -> YOLO detection ->
ByteTrack tracking -> trajectory analysis -> attribute extraction ->
metadata generation -> save (JSON/CSV + crops + annotated video) -> notify Member 2 & 3.

Usage:
    python main.py --config configs/config.yaml
"""

import argparse
import os
import hashlib
import json
import numpy as np
import supervision as sv

import cv2
from tqdm import tqdm

from src.attributes.deep_attribute_extractor import DeepAttributeExtractor
from src.detection.detector import ObjectDetector
from src.metadata.metadata_generator import MetadataGenerator
from src.tracking.tracker import ObjectTracker
from src.tracking.trajectory import TrajectoryTracker
from src.motion.motion_analyzer import MotionAnalyzer
from src.spatial.zone_analyzer import ZoneAnalyzer
from src.events.event_rules import EventDetector
from src.relationships.relation_analyzer import RelationshipAnalyzer
from src.embeddings.clip_embedder import ClipEmbedder
from src.embeddings.reid_extractor import ReidExtractor
from src.attributes.vlm_captioner import VLMCaptioner
from src.utils.helpers import (
    ensure_output_dirs,
    frame_index_to_timestamp,
    load_camera_info,
    load_config,
    make_track_key,
)
from src.utils.logger import get_logger
from src.utils.notifier import send_metadata
from src.video.frame_extractor import FrameExtractor
from src.video.preprocessor import FramePreprocessor
from src.visualization.annotator import Annotator, VideoWriter
from src.video.keyframe_selector import KeyframeSelector


def run_pipeline(config: dict) -> None:
    base_output_dir = os.environ.get(
        "AIVISION_OUTPUT_DIR",
        "output",
    )
    os.makedirs(base_output_dir, exist_ok=True)

    # Determine run directory based on input video file name
    video_path = config["video"]["input_path"]
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    run_dir = os.path.join(base_output_dir, video_name)

    config["output"]["crops_dir"] = os.path.join(run_dir, "crops")
    config["output"]["annotated_video_dir"] = os.path.join(run_dir, "annotated_video")
    config["output"]["metadata_dir"] = os.path.join(run_dir, "metadata")
    
    # Also put the log file in the run folder for self-contained runs
    config["logging"]["log_file"] = os.path.join(run_dir, "pipeline.log")

    log = get_logger(__name__, config["logging"]["log_file"], config["logging"]["level"])
    ensure_output_dirs(config)

    # Implement video detection cache checking
    video_path = config["video"]["input_path"]
    cache_key = ""
    if os.path.exists(video_path):
        mtime = os.path.getmtime(video_path)
        size = os.path.getsize(video_path)
        key_str = f"{video_path}_{size}_{mtime}"
        cache_key = hashlib.md5(key_str.encode("utf-8")).hexdigest()
    else:
        cache_key = hashlib.md5(video_path.encode("utf-8")).hexdigest()

    cache_dir = os.path.join(base_output_dir, "cache")
    os.makedirs(cache_dir, exist_ok=True)
    cache_file = os.path.join(cache_dir, f"{cache_key}_detections.json")

    cached_detections = {}
    use_cache = False
    if os.path.exists(cache_file):
        try:
            with open(cache_file, "r") as f:
                cached_detections = json.load(f)
            use_cache = True
            log.info("Found cached detections for this video. Running in fast extraction mode using cache.")
        except Exception as e:
            log.warning("Could not read cache file %s: %s", cache_file, e)

    new_cached_detections = {}

    camera_info = load_camera_info(config["video"]["camera_info_path"])
    camera_id = camera_info["camera_id"]
    log.info("Starting rich ai-vision pipeline for camera_id=%s, saving to %s", camera_id, run_dir)

    video_cfg = config["video"]
    extractor = FrameExtractor(video_cfg["input_path"], frame_skip=video_cfg["frame_skip"])
    preprocessor = FramePreprocessor(
        video_cfg["resize_width"], video_cfg["resize_height"], denoise=video_cfg["denoise"]
    )

    det_cfg = config["detection"]
    detector = ObjectDetector(
        model_path=det_cfg["model_path"],
        confidence_threshold=det_cfg["confidence_threshold"],
        iou_threshold=det_cfg["iou_threshold"],
        classes=det_cfg["classes"],
    )

    track_cfg = config["tracking"]
    tracker = ObjectTracker(
        track_activation_threshold=track_cfg["track_activation_threshold"],
        lost_track_buffer=track_cfg["lost_track_buffer"],
        minimum_matching_threshold=track_cfg["minimum_matching_threshold"],
        frame_rate=track_cfg["frame_rate"],
    )

    # Instantiate rich spatiotemporal analyzers
    trajectory_tracker = TrajectoryTracker()
    keyframe_selector = KeyframeSelector(config)
    
    motion_cfg = config.get("motion", {})
    motion_analyzer = MotionAnalyzer(
        speed_threshold_slow=motion_cfg.get("speed_threshold_slow", 2.0),
        speed_threshold_fast=motion_cfg.get("speed_threshold_fast", 8.0),
        fps=extractor.fps,
        direction_smoothing_window=motion_cfg.get("direction_smoothing_window", 7)
    )
    
    spatial_cfg = config.get("spatial", {})
    zone_analyzer = ZoneAnalyzer(zones_config=spatial_cfg.get("zones", []), fps=extractor.fps)
    
    event_detector = EventDetector(
        loitering_threshold_sec=motion_cfg.get("stationary_duration_threshold", 10.0),
        stopped_threshold_sec=motion_cfg.get("stationary_duration_threshold", 5.0),
        config=config
    )
    
    relationship_analyzer = RelationshipAnalyzer(
        proximity_threshold=150.0,
        fps=extractor.fps,
        frame_skip=video_cfg["frame_skip"]
    )

    metadata_gen = MetadataGenerator(camera_id=camera_id, config=config)
    annotator = Annotator()

    out_cfg = config["output"]
    video_writer = None
    if out_cfg["save_annotated_video"]:
        out_video_path = os.path.join(out_cfg["annotated_video_dir"], "annotated_output.mp4")
        video_writer = VideoWriter(out_video_path, fps=extractor.fps / video_cfg["frame_skip"],
                                    width=extractor.width, height=extractor.height)

    last_crop_frame_by_track = {}
    crop_interval = out_cfg.get("crop_save_interval", 15)

    progress = tqdm(total=extractor.total_frames // video_cfg["frame_skip"], desc="Processing frames")
    for frame_idx, _, frame in extractor.frames():
        frame_idx_str = str(frame_idx)
        if use_cache and frame_idx_str in cached_detections:
            frame_cache = cached_detections[frame_idx_str]
            detections = sv.Detections(
                xyxy=np.array(frame_cache["xyxy"], dtype=np.float32).reshape(-1, 4),
                confidence=np.array(frame_cache["confidence"], dtype=np.float32),
                class_id=np.array(frame_cache["class_id"], dtype=np.int32)
            )
        else:
            processed_frame, scale_x, scale_y = preprocessor.process(frame)
            detections = detector.detect(processed_frame)
            detections.xyxy = preprocessor.scale_boxes(detections.xyxy, scale_x, scale_y)
            if not use_cache:
                new_cached_detections[frame_idx_str] = {
                    "xyxy": detections.xyxy.tolist(),
                    "confidence": detections.confidence.tolist(),
                    "class_id": detections.class_id.tolist()
                }

        tracked = tracker.update(detections)

        timestamp = frame_index_to_timestamp(frame_idx, extractor.fps)
        labels = annotator.build_labels(tracked, detector.class_names)

        active_tracks_in_frame = {}

        for i in range(len(tracked)):
            if tracked.tracker_id is None or tracked.tracker_id[i] is None:
                continue  # not yet a confirmed track

            x1, y1, x2, y2 = [int(max(0, v)) for v in tracked.xyxy[i]]
            crop = frame[y1:y2, x1:x2]
            class_id = int(tracked.class_id[i])
            confidence = float(tracked.confidence[i])
            tracker_id = int(tracked.tracker_id[i])
            track_key = make_track_key(camera_id, tracker_id)
            class_name = detector.class_names.get(class_id, str(class_id))

            # Record point in trajectory
            trajectory_tracker.add_point(track_key, frame_idx, timestamp, tracked.xyxy[i])

            # Prepare dict for relationships analysis
            cx = (x1 + x2) / 2.0
            cy = (y1 + y2) / 2.0
            active_tracks_in_frame[track_key] = {
                "class_name": class_name,
                "centroid": (cx, cy)
            }

            # Feed frame candidate to keyframe selector
            keyframe_selector.add_frame_candidate(
                track_key=track_key,
                frame_idx=frame_idx,
                timestamp=timestamp,
                crop_bgr=crop,
                bbox_xyxy=tracked.xyxy[i]
            )

            crop_path = None
            should_save_crop = (
                out_cfg["save_crops"]
                and crop.size > 0
                and frame_idx - last_crop_frame_by_track.get(track_key, -crop_interval) >= crop_interval
            )
            if should_save_crop:
                crop_path = os.path.join(out_cfg["crops_dir"], f"{track_key}_{frame_idx:06d}.jpg")
                cv2.imwrite(crop_path, crop)
                last_crop_frame_by_track[track_key] = frame_idx

            # Feed tracking updates to metadata generator
            metadata_gen.update(
                track_key=track_key,
                frame_idx=frame_idx,
                timestamp=timestamp,
                class_id=class_id,
                class_name=class_name,
                bbox_xyxy=tracked.xyxy[i],
                confidence=confidence,
                attributes={},  # Appearance attributes resolved in post-processing via keyframes
                crop_path=crop_path,
            )

        # Update relationship analyzer
        if active_tracks_in_frame:
            relationship_analyzer.update(frame_idx, active_tracks_in_frame)

        if video_writer:
            annotated_frame = annotator.annotate(frame, tracked, labels)
            video_writer.write(annotated_frame)

        progress.update(1)

    progress.close()
    if video_writer:
        video_writer.release()

    if not use_cache:
        try:
            with open(cache_file, "w") as f:
                json.dump(new_cached_detections, f)
            log.info("Saved detections cache to %s", cache_file)
        except Exception as e:
            log.warning("Could not write cache file %s: %s", cache_file, e)

    # ------------------ Post-Processing (Rich Metadata) ------------------
    log.info("Finished video frames. Running rich metadata analysis on keyframes...")

    models_cfg = config.get("models", {})
    perf_cfg = config.get("performance", {})
    num_workers = int(perf_cfg.get("num_workers", 1))

    embeddings_dict = {}
    deep_attributes_dict = {}
    keyframe_quality_dict = {}
    vlm_descriptions_dict = {}

    track_keys = list(keyframe_selector.track_data.keys())

    # Per-video cache of expensive per-track features (embeddings, VLM captions,
    # heuristic attributes) so a rerun on the identical video skips model inference
    # entirely instead of repeating several seconds of work per track from scratch.
    features_cache_file = os.path.join(cache_dir, f"{cache_key}_track_features.json")
    cached_features = {}
    if os.path.exists(features_cache_file):
        try:
            with open(features_cache_file, "r") as f:
                cached_features = json.load(f)
            log.info("Found cached track features for %d tracks; reusing.", len(cached_features))
        except Exception as e:
            log.warning("Could not read track-feature cache %s: %s", features_cache_file, e)

    # Select keyframes and split into cache hits (apply immediately) vs. pending
    # work that still needs model inference.
    pending_payloads = []
    for track_key in track_keys:
        if track_key not in metadata_gen._tracks:
            continue

        if track_key in cached_features:
            feat = cached_features[track_key]
            embeddings_dict[track_key] = feat["embeddings"]
            deep_attributes_dict[track_key] = feat["deep_attributes"]
            keyframe_quality_dict[track_key] = feat["keyframe_quality"]
            vlm_descriptions_dict[track_key] = feat["vlm_description"]
            metadata_gen._tracks[track_key]["crop_paths"].extend(feat["crop_paths"])
            continue

        keyframes = keyframe_selector.select_keyframes(track_key)
        if not keyframes:
            continue

        pending_payloads.append({
            "track_key": track_key,
            "class_id": metadata_gen._tracks[track_key]["class_id"],
            "class_name": metadata_gen._tracks[track_key]["class_name"],
            "det_conf": metadata_gen._tracks[track_key]["max_confidence"],
            "keyframes": keyframes,
        })

    new_features = {}

    def _apply_result(track_key: str, keyframes: dict, result: dict) -> None:
        keyframe_quality_dict[track_key] = keyframes
        deep_attributes_dict[track_key] = result["deep_attributes"]
        embeddings_dict[track_key] = result["embeddings"]
        vlm_descriptions_dict[track_key] = result["vlm_description"]

        crop_paths = []
        best_crop = keyframes["highest_quality"]["crop"]
        best_path = os.path.join(out_cfg["crops_dir"], f"{track_key}_best_keyframe.jpg")
        cv2.imwrite(best_path, best_crop)
        crop_paths.append(best_path)

        if out_cfg.get("save_crops", True):
            for kf_name, kf_info in keyframes.items():
                kf_path = os.path.join(out_cfg["crops_dir"], f"{track_key}_{kf_name}_keyframe.jpg")
                cv2.imwrite(kf_path, kf_info["crop"])
                crop_paths.append(kf_path)

        metadata_gen._tracks[track_key]["crop_paths"].extend(crop_paths)

        # Cache everything except raw crop pixels (already written to disk above).
        new_features[track_key] = {
            "embeddings": result["embeddings"],
            "deep_attributes": result["deep_attributes"],
            "vlm_description": result["vlm_description"],
            "keyframe_quality": {
                kf_name: {"frame_idx": info["frame_idx"], "quality_score": info["quality_score"], "metrics": info["metrics"]}
                for kf_name, info in keyframes.items()
            },
            "crop_paths": crop_paths,
        }

    def _flush_cache() -> None:
        # This stage can run for hours; checkpoint periodically so an interruption
        # (crash, accidental stop, machine sleep) doesn't lose all progress made so far.
        if not new_features:
            return
        try:
            with open(features_cache_file, "w") as f:
                json.dump(new_features, f)
        except Exception as e:
            log.warning("Could not write track-feature cache checkpoint %s: %s", features_cache_file, e)

    CHECKPOINT_EVERY = 10

    if pending_payloads:
        if num_workers > 1:
            from concurrent.futures import ProcessPoolExecutor
            from src.pipeline.parallel_extraction import init_worker, process_track

            payload_by_key = {p["track_key"]: p for p in pending_payloads}
            with ProcessPoolExecutor(max_workers=num_workers, initializer=init_worker, initargs=(config, num_workers)) as executor:
                results = executor.map(process_track, pending_payloads)
                for i, result in enumerate(tqdm(results, total=len(pending_payloads), desc="Extracting DL keyframe features (parallel)")):
                    track_key = result["track_key"]
                    _apply_result(track_key, payload_by_key[track_key]["keyframes"], result)
                    if (i + 1) % CHECKPOINT_EVERY == 0:
                        _flush_cache()
        else:
            clip_embedder = ClipEmbedder(models_cfg["clip_model_name"]) if models_cfg.get("clip_model_name") else None
            reid_extractor = ReidExtractor() if models_cfg.get("use_reid") else None
            vlm_captioner = VLMCaptioner(models_cfg.get("vlm_model_name", "microsoft/Florence-2-base")) \
                if models_cfg.get("use_vlm_caption") else None
            deep_attr_extractor = DeepAttributeExtractor(config)

            for i, payload in enumerate(tqdm(pending_payloads, desc="Extracting DL keyframe features")):
                keyframes = payload["keyframes"]
                best_crop = keyframes["highest_quality"]["crop"]

                clip_emb = clip_embedder.embed_crop(best_crop) if clip_embedder else None
                reid_emb = reid_extractor.extract_reid(best_crop) if reid_extractor else None
                vlm_desc = vlm_captioner.describe(best_crop) if vlm_captioner else None

                deep_attrs = {}
                for kf_name, kf_info in keyframes.items():
                    deep_attrs[kf_name] = deep_attr_extractor.extract(
                        kf_info["crop"], payload["class_id"], payload["det_conf"], class_name=payload["class_name"]
                    )

                result = {
                    "track_key": payload["track_key"],
                    "embeddings": {"clip": clip_emb, "reid": reid_emb},
                    "vlm_description": vlm_desc,
                    "deep_attributes": deep_attrs,
                }
                _apply_result(payload["track_key"], keyframes, result)
                if (i + 1) % CHECKPOINT_EVERY == 0:
                    _flush_cache()

    if new_features:
        _flush_cache()
        if os.path.exists(features_cache_file):
            log.info("Saved track-feature cache for %d tracks to %s", len(new_features), features_cache_file)

    # Finalize all metadata categories
    finalized_records = metadata_gen.finalize(
        trajectory_tracker=trajectory_tracker,
        motion_analyzer=motion_analyzer,
        zone_analyzer=zone_analyzer,
        event_detector=event_detector,
        relationship_analyzer=relationship_analyzer,
        embeddings_dict=embeddings_dict,
        deep_attributes_dict=deep_attributes_dict,
        keyframe_quality_dict=keyframe_quality_dict,
        vlm_descriptions_dict=vlm_descriptions_dict,
        fps=extractor.fps
    )

    json_path = os.path.join(out_cfg["metadata_dir"], "metadata.json")
    csv_path = os.path.join(out_cfg["metadata_dir"], "metadata.csv")
    metadata_gen.save_json(json_path, finalized_records)
    metadata_gen.save_csv(csv_path, finalized_records)
    log.info("Saved rich metadata for %d tracks to %s and %s", len(finalized_records), json_path, csv_path)

    integ_cfg = config.get("integration", {})
    if integ_cfg.get("send_on_finalize"):
        send_metadata(
            finalized_records,
            ai_search_endpoint=integ_cfg.get("ai_search_endpoint", ""),
            backend_endpoint=integ_cfg.get("backend_endpoint", ""),
        )

    log.info("Pipeline complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the rich ai-vision CCTV analytics pipeline.")
    parser.add_argument("--config", default="configs/config.yaml", help="Path to config.yaml")
    args = parser.parse_args()

    cfg = load_config(args.config)
    run_pipeline(cfg)
