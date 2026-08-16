"""
Logical track merging for tracking the same object across cameras/time.
"""

from __future__ import annotations
import numpy as np
from search.performance.cache import PerformanceCache
from search.filters import parse_iso_time


class TrackMerger:

    @staticmethod
    def merge(tracks: list, similarity_threshold: float = 0.75) -> list[dict]:
        """
        Groups matching tracks representing the same logical entity.
        """
        groups = []
        visited = set()

        for i, t1 in enumerate(tracks):
            tid1 = getattr(t1, "track_id", "")
            if tid1 in visited:
                continue

            # Start a new group
            member_tracks = [tid1]
            reasons = []
            visited.add(tid1)

            for j in range(i + 1, len(tracks)):
                t2 = tracks[j]
                tid2 = getattr(t2, "track_id", "")
                if tid2 in visited:
                    continue

                # 1. License Plate match is extremely strong
                plate1 = getattr(t1, "vehicle_number", "")
                plate2 = getattr(t2, "vehicle_number", "")
                plates_match = plate1 and plate2 and plate1.strip().lower() == plate2.strip().lower()

                # 2. Embedding similarity check
                emb1 = PerformanceCache.get_embedding_by_track_id(tid1)
                emb2 = PerformanceCache.get_embedding_by_track_id(tid2)
                sim = float(np.dot(emb1, emb2)) if emb1 is not None and emb2 is not None else 0.0

                # Determine if they represent the same logical entity
                should_merge = False
                confidence = 0.0
                reason_str = ""

                if plates_match:
                    should_merge = True
                    confidence = 0.99
                    reason_str = f"Matching plates: {plate1}"
                elif sim >= similarity_threshold:
                    # check class compatibility
                    c1 = getattr(t1, "class_name", "")
                    c2 = getattr(t2, "class_name", "")
                    if c1 == c2:
                        should_merge = True
                        confidence = sim
                        reason_str = f"High embedding similarity ({sim:.2f}) and matching class ({c1})"

                if should_merge:
                    member_tracks.append(tid2)
                    visited.add(tid2)
                    if reason_str not in reasons:
                        reasons.append(reason_str)

            if len(member_tracks) > 1:
                # Store merged identity
                groups.append({
                    "merged_track_id": f"merged_{tid1}",
                    "member_tracks": member_tracks,
                    "confidence": round(float(np.mean([confidence if confidence > 0 else 1.0])), 4) if len(member_tracks) > 1 else 1.0,
                    "reasons": reasons
                })

        return groups
