"""
Analyzes object lifecycle state transitions from available metadata.
"""

from __future__ import annotations
from search.filters import parse_iso_time


class LifecycleAnalyzer:

    @staticmethod
    def analyze(tracks: list) -> list[dict]:
        """
        Determines the state transition lifecycle for each unique track.
        """
        lifecycles = []

        for t in tracks:
            track_id = getattr(t, "track_id", "")
            cam_id = getattr(t, "camera_id", "")
            zone = getattr(t, "zone", "")
            events_str = getattr(t, "events", "")
            first_seen = getattr(t, "first_seen_time", "")
            last_seen = getattr(t, "last_seen_time", "")
            duration = getattr(t, "duration", 0.0)

            events_list = [e.strip() for e in events_str.split(",") if e.strip()]

            # Formulate stages
            stages = []
            stages.append({
                "stage": "FIRST_SEEN",
                "timestamp": first_seen,
                "camera_id": cam_id,
                "zone": zone,
                "description": f"Object first detected in camera {cam_id} ({zone} zone)."
            })

            # Intermediate stage if loitering or multiple events exist
            for ev in events_list:
                if ev not in ("entered", "exited"):
                    stages.append({
                        "stage": "EVENT_OBSERVED",
                        "timestamp": first_seen,
                        "camera_id": cam_id,
                        "zone": zone,
                        "description": f"Activity recorded: {ev.replace('_', ' ')}."
                    })

            stages.append({
                "stage": "LAST_SEEN",
                "timestamp": last_seen,
                "camera_id": cam_id,
                "zone": zone,
                "description": f"Object last observed after {duration:.1f} seconds."
            })

            lifecycles.append({
                "track_id": track_id,
                "first_seen": first_seen,
                "last_seen": last_seen,
                "duration": duration,
                "stages": stages
            })

        return lifecycles
