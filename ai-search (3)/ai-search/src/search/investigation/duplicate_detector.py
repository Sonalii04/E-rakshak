"""
Detects potential duplicate tracks based on embedding similarity and temporal overlap.
"""

from __future__ import annotations
from search.filters import parse_iso_time
from search.performance.cache import PerformanceCache


class DuplicateDetector:

    @staticmethod
    def detect(tracks: list, similarity_threshold: float = 0.90, time_threshold_seconds: float = 15.0) -> list[dict]:
        """
        Scans matching results for probable duplicates.
        """
        duplicates = []
        seen_pairs = set()

        for i in range(len(tracks)):
            for j in range(i + 1, len(tracks)):
                t1 = tracks[i]
                t2 = tracks[j]

                track_id1 = getattr(t1, "track_id", "")
                track_id2 = getattr(t2, "track_id", "")

                if track_id1 == track_id2:
                    continue

                pair_key = tuple(sorted([track_id1, track_id2]))
                if pair_key in seen_pairs:
                    continue

                # 1. Check exact vehicle number overlap if present
                v1 = getattr(t1, "vehicle_number", "")
                v2 = getattr(t2, "vehicle_number", "")
                has_same_plate = v1 and v2 and v1.strip().lower() == v2.strip().lower()

                # 2. Get embeddings to compare similarity
                emb1 = PerformanceCache.get_embedding_by_track_id(track_id1)
                emb2 = PerformanceCache.get_embedding_by_track_id(track_id2)

                cosine_sim = 0.0
                if emb1 is not None and emb2 is not None:
                    # Normalized vectors, dot product = cosine similarity
                    cosine_sim = float(np.dot(emb1, emb2))

                # 3. Check time proximity
                time1 = parse_iso_time(getattr(t1, "first_seen_time", ""))
                time2 = parse_iso_time(getattr(t2, "first_seen_time", ""))

                time_diff = abs((time1 - time2).total_seconds()) if time1 and time2 else float('inf')

                # Deciding duplicates
                is_duplicate = False
                confidence = 0.0
                reasons = []

                if cosine_sim >= similarity_threshold and time_diff <= time_threshold_seconds:
                    is_duplicate = True
                    confidence = 0.5 + (cosine_sim - similarity_threshold) / (1.0 - similarity_threshold) * 0.5
                    reasons.append("High embedding similarity and concurrent appearance")
                elif has_same_plate and time_diff <= time_threshold_seconds:
                    is_duplicate = True
                    confidence = 0.95
                    reasons.append("Identical license plate and close timestamps")

                if is_duplicate:
                    seen_pairs.add(pair_key)
                    duplicates.append({
                        "track_id_1": track_id1,
                        "track_id_2": track_id2,
                        "embedding_similarity": round(cosine_sim, 4),
                        "time_difference_seconds": time_diff,
                        "confidence": round(confidence, 4),
                        "reasons": reasons
                    })

        return duplicates

# Import numpy safely inside
import numpy as np
