"""Per-track feature extraction (CLIP/Re-ID embeddings, VLM caption, heuristic
attributes) distributed across a pool of worker processes.

The per-track loop in main.py is model-inference-bound (each track needs several
seconds of CPU-only VLM/embedding/OCR work), so running it sequentially wastes every
CPU core but one. Each worker process here constructs its own copy of the heavy
models exactly once (in `init_worker`, used as a `ProcessPoolExecutor` initializer)
and reuses them across every track that worker is assigned, rather than reloading
per task.
"""

_models = None


def init_worker(config, num_workers: int = 1):
    """ProcessPoolExecutor initializer: build the heavy models once per worker process.

    Each worker's PyTorch/BLAS backend defaults to using every CPU core for its own
    intra-op parallelism; with num_workers>1 processes doing that simultaneously they
    oversubscribe the machine's cores and fight each other for time, largely erasing
    the benefit of running multiple workers at all. Cap each worker to its fair share
    of cores instead. Must happen before numpy/torch/MKL are imported anywhere in this
    process for the BLAS env vars to take effect (safe here under Windows'
    spawn-based multiprocessing, since each worker starts as a fresh interpreter that
    hasn't imported them yet).
    """
    import os
    threads_per_worker = max(1, (os.cpu_count() or num_workers) // max(1, num_workers))
    for var in ("OMP_NUM_THREADS", "MKL_NUM_THREADS", "OPENBLAS_NUM_THREADS", "NUMEXPR_NUM_THREADS"):
        os.environ[var] = str(threads_per_worker)

    import torch
    torch.set_num_threads(threads_per_worker)

    global _models
    from src.embeddings.clip_embedder import ClipEmbedder
    from src.embeddings.reid_extractor import ReidExtractor
    from src.attributes.vlm_captioner import VLMCaptioner
    from src.attributes.deep_attribute_extractor import DeepAttributeExtractor

    models_cfg = config.get("models", {})
    _models = {
        "clip": ClipEmbedder(models_cfg["clip_model_name"]) if models_cfg.get("clip_model_name") else None,
        "reid": ReidExtractor() if models_cfg.get("use_reid") else None,
        "vlm": VLMCaptioner(models_cfg.get("vlm_model_name", "microsoft/Florence-2-base"))
        if models_cfg.get("use_vlm_caption") else None,
        "deep_attr": DeepAttributeExtractor(config),
    }


def process_track(payload: dict) -> dict:
    """Run all per-track model inference for one track's keyframes.

    payload: {"track_key", "class_id", "class_name", "det_conf",
              "keyframes": {kf_name: {"crop": ndarray, "frame_idx", "quality_score", "metrics"}}}
    Returns a plain-data dict (no model/crop objects) with the computed features.
    """
    track_key = payload["track_key"]
    class_id = payload["class_id"]
    class_name = payload["class_name"]
    det_conf = payload["det_conf"]
    keyframes = payload["keyframes"]

    best_crop = keyframes["highest_quality"]["crop"]

    clip_emb = _models["clip"].embed_crop(best_crop) if _models["clip"] else None
    reid_emb = _models["reid"].extract_reid(best_crop) if _models["reid"] else None
    vlm_desc = _models["vlm"].describe(best_crop) if _models["vlm"] else None

    deep_attrs = {}
    for kf_name, kf_info in keyframes.items():
        deep_attrs[kf_name] = _models["deep_attr"].extract(
            kf_info["crop"], class_id, det_conf, class_name=class_name
        )

    return {
        "track_key": track_key,
        "embeddings": {"clip": clip_emb, "reid": reid_emb},
        "vlm_description": vlm_desc,
        "deep_attributes": deep_attrs,
    }
