"""
Structured metadata filters.
"""

import re
from datetime import datetime


def normalize_plate(plate: str) -> str:
    if not plate:
        return ""
    return re.sub(r'[^A-Za-z0-9]', '', plate).upper()


def parse_iso_time(time_str: str) -> datetime:
    if not time_str:
        return None
    # Normalize Z to +00:00
    if time_str.endswith('Z'):
        time_str = time_str[:-1] + '+00:00'
    try:
        return datetime.fromisoformat(time_str)
    except Exception:
        # Fallback if format has minor deviations
        try:
            return datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S")
        except Exception:
            return None


class ResultFilter:

    @staticmethod
    def apply(results, filters):
        filtered = results

        # -------------------------
        # Track ID
        # -------------------------
        if getattr(filters, "track_id", None):
            val = filters.track_id.strip().lower()
            if val:
                filtered = [
                    r for r in filtered
                    if getattr(r, "track_id", "").strip().lower() == val
                ]

        # -------------------------
        # Camera
        # -------------------------
        if getattr(filters, "camera_id", None):
            val = filters.camera_id.strip().lower()
            if val:
                filtered = [
                    r for r in filtered
                    if getattr(r, "camera_id", "").strip().lower() == val
                ]

        # -------------------------
        # Category
        # -------------------------
        if getattr(filters, "category", None):
            val = filters.category.strip().lower()
            if val:
                filtered = [
                    r for r in filtered
                    if getattr(r, "category", "").strip().lower() == val
                ]

        # -------------------------
        # Detected Type
        # -------------------------
        if getattr(filters, "detected_type", None):
            val = filters.detected_type.strip().lower()
            if val:
                filtered = [
                    r for r in filtered
                    if getattr(r, "detected_type", "").strip().lower() == val
                ]

        # -------------------------
        # Vehicle Type
        # -------------------------
        if getattr(filters, "vehicle_type", None):
            val = filters.vehicle_type.strip().lower()
            if val:
                filtered = [
                    r for r in filtered
                    if (getattr(r, "vehicle_type", "").strip().lower() == val)
                    or (val in getattr(r, "description", "").lower())
                    or (val in getattr(r, "vlm_description", "").lower())
                ]

        # -------------------------
        # Vehicle Number
        # -------------------------
        if getattr(filters, "vehicle_number", None):
            val = normalize_plate(filters.vehicle_number)
            if val:
                filtered = [
                    r for r in filtered
                    if val in normalize_plate(getattr(r, "vehicle_number", ""))
                ]

        # -------------------------
        # Color
        # -------------------------
        if getattr(filters, "color", None):
            val = filters.color.strip().lower()
            if val:
                filtered = [
                    r for r in filtered
                    if (getattr(r, "color", "").strip().lower() == val)
                    or (val in getattr(r, "description", "").lower())
                    or (val in getattr(r, "vlm_description", "").lower())
                ]

        # -------------------------
        # Upper Body
        # -------------------------
        if getattr(filters, "upper_body", None):
            val = filters.upper_body.strip().lower()
            if val:
                filtered = [
                    r for r in filtered
                    if getattr(r, "upper_body", "").strip().lower() == val
                ]

        # -------------------------
        # Lower Body
        # -------------------------
        if getattr(filters, "lower_body", None):
            val = filters.lower_body.strip().lower()
            if val:
                filtered = [
                    r for r in filtered
                    if getattr(r, "lower_body", "").strip().lower() == val
                ]

        # -------------------------
        # Zone
        # -------------------------
        if getattr(filters, "zone", None):
            val = filters.zone.strip().lower()
            if val:
                filtered = [
                    r for r in filtered
                    if (getattr(r, "zone", "").strip().lower() == val)
                    or (val in getattr(r, "description", "").lower())
                    or (val in getattr(r, "vlm_description", "").lower())
                ]

        # -------------------------
        # Event
        # -------------------------
        if getattr(filters, "event", None):
            val = filters.event.strip().lower()
            if val:
                # Support multi-events checking: all requested query events are matched
                q_events = [e.strip() for e in re.split(r'[,\s]+', val) if e.strip()]
                if q_events:
                    filtered_temp = []
                    for r in filtered:
                        r_events = [e.strip().lower() for e in getattr(r, "events", "").split(",") if e.strip()]
                        if all(any(qe in re_val for re_val in r_events) for qe in q_events):
                            filtered_temp.append(r)
                    filtered = filtered_temp

        # -------------------------
        # Group Size
        # -------------------------
        if getattr(filters, "group_size", None) is not None:
            filtered = [
                r for r in filtered
                if getattr(r, "group_size", 0) == filters.group_size
            ]

        if getattr(filters, "min_group_size", None) is not None:
            filtered = [
                r for r in filtered
                if getattr(r, "group_size", 0) >= filters.min_group_size
            ]

        if getattr(filters, "max_group_size", None) is not None:
            filtered = [
                r for r in filtered
                if getattr(r, "group_size", 0) <= filters.max_group_size
            ]

        # -------------------------
        # Near Vehicle
        # -------------------------
        if getattr(filters, "near_vehicle", None):
            val = filters.near_vehicle.strip().lower()
            if val:
                filtered = [
                    r for r in filtered
                    if getattr(r, "near_vehicle", "").strip().lower() == val
                ]

        # -------------------------
        # Duration
        # -------------------------
        if getattr(filters, "min_duration", None) is not None:
            filtered = [
                r for r in filtered
                if getattr(r, "duration", 0.0) >= filters.min_duration
            ]

        if getattr(filters, "max_duration", None) is not None:
            filtered = [
                r for r in filtered
                if getattr(r, "duration", 0.0) <= filters.max_duration
            ]

        # -------------------------
        # Time Window
        # -------------------------
        if getattr(filters, "start_time", None):
            start = parse_iso_time(filters.start_time)
            if start:
                filtered_temp = []
                for r in filtered:
                    r_time = parse_iso_time(getattr(r, "first_seen_time", ""))
                    if r_time and r_time >= start:
                        filtered_temp.append(r)
                filtered = filtered_temp

        if getattr(filters, "end_time", None):
            end = parse_iso_time(filters.end_time)
            if end:
                filtered_temp = []
                for r in filtered:
                    r_time = parse_iso_time(getattr(r, "last_seen_time", ""))
                    if r_time and r_time <= end:
                        filtered_temp.append(r)
                filtered = filtered_temp

        return filtered