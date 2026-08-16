"""
Builds a chronological event timeline from track observations.
"""

from __future__ import annotations
from search.filters import parse_iso_time
from datetime import datetime, timedelta


class TimelineBuilder:

    @staticmethod
    def build(tracks: list) -> list[dict]:
        """
        Builds a sorted list of timeline events by unpacking multi-valued track events.
        """
        events_timeline = []

        for t in tracks:
            track_id = getattr(t, "track_id", "")
            cam_id = getattr(t, "camera_id", "")
            zone = getattr(t, "zone", "")
            desc = getattr(t, "description", "")
            first_seen = getattr(t, "first_seen_time", "")
            last_seen = getattr(t, "last_seen_time", "")
            duration = getattr(t, "duration", 0.0)

            # Unpack events
            events_str = getattr(t, "events", "")
            t_events = [e.strip() for e in events_str.split(",") if e.strip()]

            if not t_events:
                # Fallback event if none are specified
                t_events = ["observed"]

            t1 = parse_iso_time(first_seen)

            for idx, event in enumerate(t_events):
                # Distribute events temporally if there are multiple
                if len(t_events) > 1 and duration > 0 and t1:
                    fraction = idx / (len(t_events) - 1)
                    event_time = (t1 + timedelta(seconds=duration * fraction)).isoformat()
                else:
                    event_time = first_seen

                events_timeline.append({
                    "timestamp": event_time,
                    "track_id": track_id,
                    "camera_id": cam_id,
                    "zone": zone,
                    "event": event,
                    "description": f"Object observed {event.replace('_', ' ')}: {desc}"
                })

        # Sort timeline chronologically
        events_timeline.sort(key=lambda x: parse_iso_time(x["timestamp"]) or datetime.min)
        return events_timeline
