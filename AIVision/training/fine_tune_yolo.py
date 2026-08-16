"""Active Learning and Fine-Tuning script for vehicle detection YOLO model.

This script guides the data collection, preparation, dataset formatting, and
fine-tuning process for YOLOv11/YOLOv12 to support custom vehicle classes:
auto_rickshaw, e-rickshaw, bike, scooter, van, in addition to standard classes.
"""

import os
import argparse
import logging
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def create_mock_dataset_layout(data_dir: str):
    """Setup standard YOLO PyTorch dataset layout."""
    for split in ["train", "val"]:
        os.makedirs(os.path.join(data_dir, "images", split), exist_ok=True)
        os.makedirs(os.path.join(data_dir, "labels", split), exist_ok=True)
    logger.info("Created YOLO dataset directory layout at: %s", data_dir)


def write_dataset_yaml(data_dir: str, yaml_path: str):
    """Write YOLO dataset config yaml file."""
    yaml_content = f"""# Dataset YAML for custom AIVision vehicle categories
path: {os.path.abspath(data_dir)}
train: images/train
val: images/val

names:
  0: person
  1: bicycle
  2: car
  3: motorcycle
  4: airplane
  5: bus
  6: train
  7: truck
  8: boat
  9: traffic light
  10: fire hydrant
  11: stop sign
  12: parking meter
  13: bench
  14: bird
  15: cat
  16: dog
  17: horse
  18: sheep
  19: cow
  20: elephant
  21: bear
  22: zebra
  23: giraffe
  24: backpack
  25: umbrella
  26: handbag
  27: tie
  28: suitcase
  29: frisbee
  30: skis
  31: snowboard
  32: sports ball
  33: kite
  34: baseball bat
  35: baseball glove
  36: skateboard
  37: surfboard
  38: tennis racket
  39: bottle
  40: wine glass
  41: cup
  42: fork
  43: knife
  44: spoon
  45: bowl
  46: banana
  47: apple
  48: sandwich
  49: orange
  50: broccoli
  51: carrot
  52: hot dog
  53: pizza
  54: donut
  55: cake
  56: chair
  57: couch
  58: potted plant
  59: bed
  60: dining table
  61: toilet
  62: tv
  63: laptop
  64: mouse
  65: remote
  66: keyboard
  67: cell phone
  68: microwave
  69: oven
  70: toaster
  71: sink
  72: refrigerator
  73: book
  74: clock
  75: vase
  76: scissors
  77: teddy bear
  78: hair drier
  79: toothbrush
  80: auto_rickshaw
  81: e-rickshaw
  82: bike
  83: scooter
  84: van
"""
    with open(yaml_path, "w") as f:
        f.write(yaml_content.strip())
    logger.info("Wrote dataset configuration YAML to: %s", yaml_path)


def fine_tune(weights_path: str, dataset_yaml: str, epochs: int, batch_size: int, device: str):
    """Run model fine-tuning process."""
    logger.info("Loading baseline weights: %s", weights_path)
    model = YOLO(weights_path)
    
    logger.info("Starting fine-tuning for %d epochs on device %s...", epochs, device)
    
    # Run YOLO training (freeze backbone layers optionally to preserve COCO weights)
    results = model.train(
        data=dataset_yaml,
        epochs=epochs,
        batch=batch_size,
        imgsz=640,
        device=device,
        freeze=10,  # freeze first 10 layers (backbone features) to retain generic detectors
        workers=2,
        val=True
    )
    logger.info("Fine-tuning completed. Results saved to model's default project folder.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Active Learning and YOLO detector fine-tuning template script.")
    parser.add_argument("--weights", default="models/yolo11n.pt", help="Baseline weights")
    parser.add_argument("--data_dir", default="data/custom_dataset", help="Directory for training images and labels")
    parser.add_argument("--yaml", default="configs/custom_dataset.yaml", help="Output YAML config path")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=8, help="Batch size")
    parser.add_argument("--device", default="cpu", help="Device to train on (cpu or cuda)")
    
    args = parser.parse_args()
    
    # Initialize workspace paths
    create_mock_dataset_layout(args.data_dir)
    write_dataset_yaml(args.data_dir, args.yaml)
    
    # Since dataset is typically empty at initialization, print guide instructions
    train_img_dir = os.path.join(args.data_dir, "images", "train")
    if len(os.listdir(train_img_dir)) == 0:
        logger.warning("No training samples found in %s", train_img_dir)
        logger.info("=== Active Learning Data Collection Guide ===")
        logger.info("1. Crop out or download target video frames containing auto_rickshaw, e-rickshaw, bike, scooter, van.")
        logger.info("2. Save the images to: data/custom_dataset/images/train/ (and split 15% to images/val/)")
        logger.info("3. Label using CVAT, labelImg, or Roboflow using the labels mapping:")
        logger.info("   Classes 0..79: standard COCO classes")
        logger.info("   Class 80: auto_rickshaw")
        logger.info("   Class 81: e-rickshaw")
        logger.info("   Class 82: bike")
        logger.info("   Class 83: scooter")
        logger.info("   Class 84: van")
        logger.info("4. Save labels in YOLO txt format to: data/custom_dataset/labels/train/ (and split to labels/val/)")
        logger.info("5. Run this script again to execute training.")
    else:
        fine_tune(args.weights, args.yaml, args.epochs, args.batch, args.device)
