"""
Similar Object Search based on FAISS embeddings and metadata filters.
"""

from __future__ import annotations
import numpy as np
from search.performance.cache import PerformanceCache
from search.filters import ResultFilter, parse_iso_time
from search.schemas import FilterConfig, SearchResult


class SimilarObjectSearch:

    def __init__(self, search_engine) -> None:
        self.search_engine = search_engine

    def search(
        self,
        reference_track_id: str,
        top_k: int = 10,
        same_camera: bool = False,
        different_cameras: bool = False,
        time_window_seconds: float = None,
        same_class: bool = False,
        same_color: bool = False,
        same_vehicle_type: bool = False,
    ) -> list[SearchResult]:
        """
        Find tracks similar to the reference track.
        """
        # 1. Obtain reference track metadata and embedding
        ref_meta = PerformanceCache.get_track_by_id(reference_track_id)
        if not ref_meta:
            raise ValueError(f"Reference track '{reference_track_id}' not found.")

        ref_emb = PerformanceCache.get_embedding_by_track_id(reference_track_id)
        if ref_emb is None:
            raise ValueError(f"Embedding for reference track '{reference_track_id}' is not available.")

        # 2. Search FAISS
        candidate_pool = max(top_k * 10, 100)
        scores, indices = self.search_engine.faiss.search(ref_emb, candidate_pool)

        # 3. Map to SearchResult
        results = self.search_engine.mapper.map_results(indices, scores)

        # 4. Exclude itself
        results = [r for r in results if r.track_id != reference_track_id]

        # 5. Apply compatible metadata constraints
        filtered = []
        ref_time = parse_iso_time(ref_meta.get("first_seen", ""))

        for r in results:
            # Same camera logic
            if same_camera and r.camera_id != ref_meta.get("camera_id"):
                continue
            
            # Different cameras logic
            if different_cameras and r.camera_id == ref_meta.get("camera_id"):
                continue

            # Class/Category matching
            if same_class and r.class_name != ref_meta.get("class"):
                continue

            # Color matching
            if same_color and r.color != ref_meta.get("color"):
                continue

            # Vehicle type matching
            if same_vehicle_type and r.vehicle_type != ref_meta.get("vehicle_type"):
                continue

            # Time window constraint
            if time_window_seconds is not None and ref_time:
                r_time = parse_iso_time(r.first_seen_time)
                if r_time:
                    diff = abs((r_time - ref_time).total_seconds())
                    if diff > time_window_seconds:
                        continue

            filtered.append(r)

        # 6. Return top K
        return filtered[:top_k]
