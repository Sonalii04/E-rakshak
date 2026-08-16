"""
Calculates dynamic statistics from search results for investigations.
"""

from __future__ import annotations
from collections import Counter
from search.filters import parse_iso_time


class StatisticsBuilder:

    @staticmethod
    def build(tracks: list) -> dict:
        """
        Dynamically aggregates statistics across a list of track search results.
        """
        if not tracks:
            return {}

        total_matches = len(tracks)
        unique_tracks = len(set(getattr(t, "track_id", "") for t in tracks))
        unique_cameras = len(set(getattr(t, "camera_id", "") for t in tracks))

        # Time span
        timestamps = []
        for t in tracks:
            t1 = parse_iso_time(getattr(t, "first_seen_time", ""))
            t2 = parse_iso_time(getattr(t, "last_seen_time", ""))
            if t1:
                timestamps.append(t1)
            if t2:
                timestamps.append(t2)

        time_span = ""
        if timestamps:
            min_time = min(timestamps)
            max_time = max(timestamps)
            duration_diff = (max_time - min_time).total_seconds()
            time_span = f"{min_time.isoformat()} to {max_time.isoformat()} ({duration_diff:.1f}s)"

        # Value frequencies
        zones = Counter(getattr(t, "zone", "") for t in tracks)
        categories = Counter(getattr(t, "category", "") for t in tracks)
        detected_types = Counter(getattr(t, "detected_type", "") for t in tracks)
        vehicle_types = Counter(getattr(t, "vehicle_type", "") for t in tracks)
        colors = Counter(getattr(t, "color", "") for t in tracks)

        # Event counts (events can be comma-separated)
        events_counter = Counter()
        for t in tracks:
            events_str = getattr(t, "events", "")
            for ev in events_str.split(","):
                if ev.strip():
                    events_counter[ev.strip()] += 1

        # Group sizes
        group_sizes = [getattr(t, "group_size", 1) for t in tracks]
        group_stats = {
            "average": float(sum(group_sizes) / len(group_sizes)) if group_sizes else 0.0,
            "min": int(min(group_sizes)) if group_sizes else 0,
            "max": int(max(group_sizes)) if group_sizes else 0
        }

        # Similarities
        similarities = [getattr(t, "similarity_score", 0.0) for t in tracks]
        similarity_stats = {
            "average": float(sum(similarities) / len(similarities)) if similarities else 0.0,
            "min": float(min(similarities)) if similarities else 0.0,
            "max": float(max(similarities)) if similarities else 0.0
        }

        return {
            "total_matches": total_matches,
            "unique_tracks": unique_tracks,
            "unique_cameras": unique_cameras,
            "time_span": time_span,
            "zones": dict(zones),
            "categories": dict(categories),
            "detected_types": dict(detected_types),
            "vehicle_types": dict(vehicle_types),
            "colors": dict(colors),
            "events": dict(events_counter),
            "group_size_stats": group_stats,
            "similarity_stats": similarity_stats
        }
