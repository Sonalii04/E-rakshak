"""
Loads and validates metadata.csv.
"""

from pathlib import Path
import numpy as np
import pandas as pd

from core.exceptions import MetadataError


class MetadataLoader:
    """
    Load metadata from CSV and normalize values.
    """
    REQUIRED_COLUMNS = {"track_id", "camera_id"}
    EXPECTED_COLUMNS = {
        "track_id",
        "camera_id",
        "class",
        "category",
        "detected_type",
        "vehicle_type",
        "vehicle_number",
        "color",
        "upper_body",
        "lower_body",
        "first_seen",
        "last_seen",
        "duration",
        "zone",
        "events",
        "group_size",
        "near_vehicle",
        "description",
        "vlm_description",
    }

    def __init__(self, csv_path: str):
        self.csv_path = Path(csv_path)

    def load(self) -> pd.DataFrame:
        if not self.csv_path.exists():
            raise MetadataError(
                f"Metadata not found: {self.csv_path}"
            )

        metadata = pd.read_csv(self.csv_path)

        # 1. Check required columns (support synonyms)
        # Check if track_id is present
        if "track_id" not in metadata.columns:
            raise MetadataError("Missing required column: track_id")

        # Map synonyms for compatibility
        synonyms = {
            "camera_id": ["camera_id"],
            "class": ["class_name"],
            "first_seen": ["first_seen_time"],
            "last_seen": ["last_seen_time"],
        }
        for target, syn_list in synonyms.items():
            if target not in metadata.columns or metadata[target].isnull().all():
                for syn in syn_list:
                    if syn in metadata.columns:
                        metadata[target] = metadata[syn]
                        break

        # Check camera_id
        if "camera_id" not in metadata.columns:
            raise MetadataError("Missing required column: camera_id")

        # 2. Add missing expected columns as empty/defaults to prevent crashes
        for col in self.EXPECTED_COLUMNS:
            if col not in metadata.columns:
                if col in ("duration", "group_size"):
                    metadata[col] = np.nan
                else:
                    metadata[col] = ""

        # 3. Clean up and normalize NaN / derive fallback values safely
        # Helper to parse time
        def parse_time_helper(t_val):
            t_str = str(t_val).strip() if pd.notna(t_val) else ""
            if not t_str:
                return None
            if t_str.endswith('Z'):
                t_str = t_str[:-1] + '+00:00'
            try:
                return datetime.fromisoformat(t_str)
            except Exception:
                try:
                    return datetime.strptime(t_str, "%Y-%m-%d %H:%M:%S")
                except Exception:
                    return None

        # Clean strings and handle NaN
        for col in metadata.columns:
            if col not in ("duration", "group_size"):
                metadata[col] = metadata[col].fillna("").astype(str).str.strip()

        # Derive missing category
        if "category" in metadata.columns:
            for idx, row in metadata.iterrows():
                val = row["category"]
                if not val or val == "nan":
                    cls_val = row.get("class", "").lower()
                    if cls_val in ("person", "human", "pedestrian"):
                        metadata.at[idx, "category"] = "person"
                    else:
                        metadata.at[idx, "category"] = "vehicle"

        # Derive missing detected_type
        if "detected_type" in metadata.columns:
            for idx, row in metadata.iterrows():
                val = row["detected_type"]
                if not val or val == "nan":
                    metadata.at[idx, "detected_type"] = row.get("class", "unknown")

        # Derive missing vehicle_type
        if "vehicle_type" in metadata.columns:
            for idx, row in metadata.iterrows():
                val = row["vehicle_type"]
                if not val or val == "nan":
                    cls_val = row.get("class", "").lower()
                    if cls_val in ("car", "bus", "truck", "motorcycle", "vehicle"):
                        metadata.at[idx, "vehicle_type"] = cls_val
                    else:
                        metadata.at[idx, "vehicle_type"] = "unknown"

        # Derive missing color from description
        colors_to_check = ["white", "black", "gray", "grey", "blue", "red", "green", "yellow", "orange", "brown", "purple", "pink"]
        if "color" in metadata.columns:
            for idx, row in metadata.iterrows():
                val = row["color"]
                if not val or val == "nan" or val == "unknown":
                    desc = row.get("description", "").lower()
                    found = "unknown"
                    for c in colors_to_check:
                        if c in desc:
                            found = c
                            break
                    metadata.at[idx, "color"] = found

        # Derive missing events
        if "events" in metadata.columns:
            for idx, row in metadata.iterrows():
                val = row["events"]
                if not val or val == "nan":
                    metadata.at[idx, "events"] = "observed"

        # Derive missing zone
        if "zone" in metadata.columns:
            for idx, row in metadata.iterrows():
                val = row["zone"]
                if not val or val == "nan":
                    metadata.at[idx, "zone"] = "outside"

        # Derive missing vlm_description
        if "vlm_description" in metadata.columns:
            for idx, row in metadata.iterrows():
                val = row["vlm_description"]
                if not val or val == "nan":
                    metadata.at[idx, "vlm_description"] = row.get("description", "")

        # Safe duration and group_size
        metadata["group_size"] = pd.to_numeric(metadata["group_size"], errors="coerce").fillna(1).astype(int)
        
        # Calculate duration if empty
        durations = []
        for idx, row in metadata.iterrows():
            d_val = pd.to_numeric(row.get("duration"), errors="coerce")
            if pd.notna(d_val):
                durations.append(float(d_val))
            else:
                t1 = parse_time_helper(row.get("first_seen"))
                t2 = parse_time_helper(row.get("last_seen"))
                if t1 and t2:
                    durations.append(max(0.0, (t2 - t1).total_seconds()))
                else:
                    durations.append(0.0)
        metadata["duration"] = durations

        metadata = metadata.sort_values(

            by="track_id"
        ).reset_index(drop=True)

        return metadata