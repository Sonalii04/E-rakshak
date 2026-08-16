"""
Dynamically generates query suggestions based on metadata distributions.
"""

from __future__ import annotations
from collections import Counter
from search.performance.cache import PerformanceCache


class QuerySuggestions:

    @staticmethod
    def generate(limit: int = 5) -> list[str]:
        """
        Dynamically derives queries based on database metadata frequency distribution.
        """
        metadata_df = PerformanceCache.get_metadata()
        if metadata_df is None or len(metadata_df) == 0:
            return ["blue vehicle", "person outside", "red car"]

        # Extract top values
        def get_top_n(column_name, n=3):
            vals = [str(x).strip() for x in metadata_df[column_name].dropna() if str(x).strip() not in ("", "unknown")]
            if not vals:
                return []
            return [k for k, v in Counter(vals).most_common(n)]

        colors = get_top_n("color")
        types = get_top_n("detected_type")
        zones = get_top_n("zone")
        vehicle_types = get_top_n("vehicle_type")

        # Gather events
        all_events = []
        for evs in metadata_df["events"].dropna():
            for e in evs.split(","):
                e_clean = e.strip()
                if e_clean and e_clean not in ("", "unknown"):
                    all_events.append(e_clean)
        top_events = [k for k, v in Counter(all_events).most_common(3)]

        suggestions = []

        # Formulate combinations dynamically
        # Color + Type
        for c in colors:
            for t in types:
                suggestions.append(f"{c} {t}")

        # Type + Zone
        for t in types:
            for z in zones:
                suggestions.append(f"{t} in {z}")

        # Type + Event
        for t in types:
            for ev in top_events:
                suggestions.append(f"{t} {ev.replace('_', ' ')}")

        # Vehicle types
        for vt in vehicle_types:
            for c in colors:
                suggestions.append(f"{c} {vt}")

        # Remove duplicates and format nicely
        unique_suggs = []
        for s in suggestions:
            s_clean = s.lower().strip()
            if s_clean not in unique_suggs:
                unique_suggs.append(s_clean)

        return unique_suggs[:limit]
