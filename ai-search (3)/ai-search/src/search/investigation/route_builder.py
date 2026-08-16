"""
Reconstructs object routes based on chronological sequence of camera observations.
"""

from __future__ import annotations
from datetime import datetime
from search.filters import parse_iso_time


class RouteBuilder:

    @staticmethod
    def build(tracks: list) -> dict:
        """
        Builds route reconstruction and transitions from a list of matching SearchResult tracks.
        """
        # Sort tracks by first seen time
        sorted_tracks = sorted(
            [t for t in tracks if parse_iso_time(getattr(t, "first_seen_time", ""))],
            key=lambda x: parse_iso_time(getattr(x, "first_seen_time", ""))
        )

        route_nodes = []
        for t in sorted_tracks:
            route_nodes.append({
                "camera_id": getattr(t, "camera_id", ""),
                "first_seen": getattr(t, "first_seen_time", ""),
                "last_seen": getattr(t, "last_seen_time", ""),
                "zone": getattr(t, "zone", ""),
                "duration": getattr(t, "duration", 0.0),
                "track_id": getattr(t, "track_id", "")
            })

        transitions = []
        for i in range(len(route_nodes) - 1):
            curr_node = route_nodes[i]
            next_node = route_nodes[i + 1]

            curr_cam = curr_node["camera_id"]
            next_cam = next_node["camera_id"]

            if curr_cam == next_cam:
                # Same camera, different tracks (could be loitering or reappearance)
                continue

            t1 = parse_iso_time(curr_node["last_seen"])
            t2 = parse_iso_time(next_node["first_seen"])

            if t1 and t2:
                time_diff = (t2 - t1).total_seconds()
                # Compute transition confidence
                if time_diff < 0:
                    # Overlapping observations in different cameras
                    confidence = "uncertain"
                    reason = "Overlapping observations"
                elif time_diff <= 120:
                    confidence = "high"
                    reason = "Direct spatio-temporal transition within 2 mins"
                elif time_diff <= 600:
                    confidence = "medium"
                    reason = "Transition within 10 mins"
                else:
                    confidence = "low"
                    reason = "Large temporal gap between camera appearances"

                transitions.append({
                    "from_camera": curr_cam,
                    "to_camera": next_cam,
                    "transition_time_seconds": max(0.0, time_diff),
                    "confidence": confidence,
                    "reason": reason
                })

        return {
            "route_nodes": route_nodes,
            "transitions": transitions
        }
