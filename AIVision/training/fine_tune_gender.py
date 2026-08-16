"""Active Learning and Fine-Tuning script for person gender classification.

This script parses the pipeline's JSON metadata output, extracts tracks
with low gender confidence (< threshold), templates a review process, and
demonstrates how to train/fine-tune a custom gender classification head on top
of pre-extracted CLIP visual features.
"""

import os
import json
import argparse
import logging
import cv2
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def find_low_confidence_gender_tracks(metadata_path: str, threshold: float = 0.75) -> list:
    """Scan metadata JSON and find person tracks where gender confidence is low."""
    if not os.path.exists(metadata_path):
        logger.warning("Metadata JSON file not found at: %s", metadata_path)
        return []
        
    with open(metadata_path, "r") as f:
        records = json.load(f)
        
    low_conf_tracks = []
    for r in records:
        if r.get("category") == "person":
            gender = r.get("gender", "unknown")
            gender_conf = r.get("gender_confidence", 0.0)
            
            # Identify candidates that are near the threshold or are 'unknown'
            if gender == "unknown" or gender_conf < threshold:
                low_conf_tracks.append({
                    "track_id": r["track_id"],
                    "gender": gender,
                    "gender_confidence": gender_conf,
                    "crop_paths": r.get("crop_paths", [])
                })
                
    logger.info("Found %d low-confidence gender tracks in metadata", len(low_conf_tracks))
    return low_conf_tracks


def run_active_learning_review(low_conf_tracks: list, output_labels_path: str):
    """Guide the user through active learning review of low confidence tracks."""
    if not low_conf_tracks:
        logger.info("No low confidence tracks to review. Dataset is solid!")
        return
        
    logger.info("=== Starting Active Learning Review Cycle ===")
    logger.info("A total of %d tracks require manual verification.", len(low_conf_tracks))
    
    corrections = {}
    if os.path.exists(output_labels_path):
        with open(output_labels_path, "r") as f:
            try:
                corrections = json.load(f)
            except Exception:
                pass
                
    for item in low_conf_tracks[:10]: # Limit to 10 for terminal prompt demonstration
        track_id = item["track_id"]
        crops = item["crop_paths"]
        
        if track_id in corrections:
            continue
            
        if not crops:
            continue
            
        logger.info("Track: %s | Predicted: %s (Confidence: %.2f)",
                    track_id, item["gender"], item["gender_confidence"])
        logger.info("Crops available at: %s", crops[0])
        
        # In a real environment, the reviewer would view the image and type 'm', 'f', or 'u'.
        # Since this script runs headlessly, we write mock correction logic.
        # User prompt structure:
        # response = input("Enter correct gender (m = male, f = female, u = unknown, press Enter to skip): ").strip().lower()
        # For simulation, we automatically accept predictions above 0.55 as verified:
        if item["gender"] != "unknown" and item["gender_confidence"] >= 0.55:
            corrections[track_id] = {
                "crop_path": crops[0],
                "label": item["gender"]
            }
        else:
            # Mark it for manual inspection later
            corrections[track_id] = {
                "crop_path": crops[0],
                "label": "unclear"
            }
            
    with open(output_labels_path, "w") as f:
        json.dump(corrections, f, indent=2)
    logger.info("Saved review results to: %s", output_labels_path)


def train_gender_classification_head(labels_path: str, clip_model_name: str):
    """Train a simple linear classifier head on top of CLIP image embeddings.

    Demonstrates how to use the corrected active-learning labels to fine-tune
    and correct the pipeline's predictions.
    """
    if not os.path.exists(labels_path):
        logger.warning("No labels file found at: %s. Cannot train.", labels_path)
        return
        
    with open(labels_path, "r") as f:
        labels = json.load(f)
        
    labeled_samples = [item for item in labels.values() if item["label"] in ("male", "female")]
    if len(labeled_samples) < 4:
        logger.warning("Need at least 4 labeled samples to demonstrate training. Found: %d", len(labeled_samples))
        return
        
    logger.info("Preparing training dataset from %d corrected samples...", len(labeled_samples))
    
    # 1. Load CLIP embedder
    from src.embeddings.clip_embedder import get_clip_embedder_instance
    clip = get_clip_embedder_instance(clip_model_name)
    
    X = []
    y = []
    
    for sample in labeled_samples:
        img_path = sample["crop_path"]
        if not os.path.exists(img_path):
            continue
        crop = cv2.imread(img_path)
        if crop is None:
            continue
            
        # Extract CLIP features
        emb = clip.get_embedding(crop)
        if emb:
            X.append(emb)
            y.append(1.0 if sample["label"] == "female" else 0.0)
            
    if not X:
        logger.warning("Failed to extract any CLIP embeddings from sample crops.")
        return
        
    X_arr = np.array(X)
    y_arr = np.array(y)
    
    logger.info("Extracted CLIP features matrix shape: %s", str(X_arr.shape))
    
    # 2. Fit a logistic regression model (as the classification head)
    from sklearn.linear_model import LogisticRegression
    clf = LogisticRegression()
    clf.fit(X_arr, y_arr)
    
    logger.info("Successfully trained custom logistic classification head on top of CLIP features!")
    # In production, we would serialize `clf` and load it inside `PersonAttributeModel` to refine predictions.


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Active Learning gender classifier helper script.")
    parser.add_argument("--metadata", default="output/metadata/metadata.json", help="Path to pipeline metadata output")
    parser.add_argument("--labels", default="data/gender_active_labels.json", help="Output active-labels path")
    parser.add_argument("--clip_model", default="openai/clip-vit-base-patch32", help="CLIP model name")
    
    args = parser.parse_args()
    
    # Run active learning pipeline steps
    low_conf = find_low_confidence_gender_tracks(args.metadata)
    run_active_learning_review(low_conf, args.labels)
    
    # Try running the classifier head training
    try:
        train_gender_classification_head(args.labels, args.clip_model)
    except Exception as e:
        logger.warning("Demonstration training failed: %s (Check if you have correct dependencies installed)", e)
