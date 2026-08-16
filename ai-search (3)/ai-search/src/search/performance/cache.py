"""
Caching and indexing optimizations for fast metadata and embedding lookups.
"""

from __future__ import annotations
import numpy as np
import pandas as pd
from pathlib import Path
from embedding.metadata_loader import MetadataLoader
from search.query_preprocesser import normalize_plate


class PerformanceCache:
    _metadata_df: pd.DataFrame | None = None
    _embeddings: np.ndarray | None = None

    _track_to_row: dict[str, dict] = {}
    _track_to_idx: dict[str, int] = {}
    _plate_to_tracks: dict[str, list[dict]] = {}
    _camera_to_tracks: dict[str, list[dict]] = {}
    _zone_to_tracks: dict[str, list[dict]] = {}

    @classmethod
    def initialize(cls, config, force: bool = False):
        if cls._metadata_df is not None and not force:
            return

        # Load metadata using MetadataLoader
        loader = MetadataLoader(config.get("paths", "embedding_metadata"))
        cls._metadata_df = loader.load()

        # Build indices
        cls._track_to_row = {}
        cls._track_to_idx = {}
        cls._plate_to_tracks = {}
        cls._camera_to_tracks = {}
        cls._zone_to_tracks = {}

        for idx, row in cls._metadata_df.iterrows():
            row_dict = row.to_dict()
            track_id = row_dict["track_id"]
            cls._track_to_row[track_id] = row_dict
            cls._track_to_idx[track_id] = idx

            # Camera index
            cam_id = row_dict["camera_id"]
            if cam_id not in cls._camera_to_tracks:
                cls._camera_to_tracks[cam_id] = []
            cls._camera_to_tracks[cam_id].append(row_dict)

            # Zone index
            zone = row_dict["zone"]
            if zone:
                if zone not in cls._zone_to_tracks:
                    cls._zone_to_tracks[zone] = []
                cls._zone_to_tracks[zone].append(row_dict)

            # Vehicle Number index (normalized)
            plate = row_dict.get("vehicle_number", "")
            if plate:
                norm_p = normalize_plate(plate)
                if norm_p:
                    if norm_p not in cls._plate_to_tracks:
                        cls._plate_to_tracks[norm_p] = []
                    cls._plate_to_tracks[norm_p].append(row_dict)

        # Load embeddings
        emb_path = Path(config.get("paths", "embedding_file"))
        if emb_path.exists():
            cls._embeddings = np.load(emb_path).astype(np.float32)
        else:
            cls._embeddings = None

    @classmethod
    def get_metadata(cls) -> pd.DataFrame:
        if cls._metadata_df is None:
            raise RuntimeError("PerformanceCache not initialized.")
        return cls._metadata_df

    @classmethod
    def get_embeddings(cls) -> np.ndarray | None:
        return cls._embeddings

    @classmethod
    def get_track_by_id(cls, track_id: str) -> dict | None:
        return cls._track_to_row.get(track_id)

    @classmethod
    def get_idx_by_track_id(cls, track_id: str) -> int | None:
        return cls._track_to_idx.get(track_id)

    @classmethod
    def get_embedding_by_track_id(cls, track_id: str) -> np.ndarray | None:
        if cls._embeddings is None:
            return None
        idx = cls.get_idx_by_track_id(track_id)
        if idx is not None and idx < len(cls._embeddings):
            return cls._embeddings[idx]
        return None

    @classmethod
    def get_tracks_by_plate(cls, plate: str, exact: bool = True) -> list[dict]:
        norm_p = normalize_plate(plate)
        if not norm_p:
            return []
        if exact:
            return cls._plate_to_tracks.get(norm_p, [])
        else:
            # Partial match
            results = []
            for k, v in cls._plate_to_tracks.items():
                if norm_p in k:
                    results.extend(v)
            return results

    @classmethod
    def get_tracks_by_camera(cls, camera_id: str) -> list[dict]:
        return cls._camera_to_tracks.get(camera_id, [])

    @classmethod
    def get_tracks_by_zone(cls, zone: str) -> list[dict]:
        return cls._zone_to_tracks.get(zone, [])
