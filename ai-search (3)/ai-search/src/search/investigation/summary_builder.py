"""
Dynamically generates a natural language summary of search and route transitions.
"""

from __future__ import annotations


class SummaryBuilder:

    @staticmethod
    def build(stats: dict, route_data: dict) -> str:
        """
        Builds a dynamic natural-language investigation summary from stats and route.
        """
        if not stats:
            return "No matching tracks found to summarize."

        total = stats.get("total_matches", 0)
        cameras_count = stats.get("unique_cameras", 0)
        time_span = stats.get("time_span", "unknown time range")

        # Get most common values dynamically
        def get_top_item(counter_dict):
            if not counter_dict:
                return "unknown"
            return max(counter_dict, key=counter_dict.get)

        top_color = get_top_item(stats.get("colors"))
        top_type = get_top_item(stats.get("detected_types"))
        top_zone = get_top_item(stats.get("zones"))
        top_event = get_top_item(stats.get("events"))

        sentences = [
            f"The search returned {total} matches across {cameras_count} unique camera(s), spanning {time_span}."
        ]

        if top_color != "unknown" and top_type != "unknown":
            sentences.append(f"The most frequently observed object category is a '{top_color} {top_type}'.")

        if top_zone != "unknown":
            sentences.append(f"Most activities were recorded in the '{top_zone}' zone.")

        if top_event != "unknown":
            sentences.append(f"The predominant event trigger detected is '{top_event}'.")

        # Route info
        nodes = route_data.get("route_nodes", [])
        if len(nodes) > 1:
            cam_seq = [n["camera_id"] for n in nodes]
            # Unique sequential list of cameras visited
            seq = []
            for c in cam_seq:
                if not seq or seq[-1] != c:
                    seq.append(c)
            path_str = " -> ".join(seq)
            sentences.append(f"Reconstructed movement path across cameras: {path_str}.")

        # Transitions
        transitions = route_data.get("transitions", [])
        if transitions:
            high_conf = [t for t in transitions if t["confidence"] == "high"]
            if high_conf:
                cams = [f"{t['from_camera']} to {t['to_camera']}" for t in high_conf]
                sentences.append(f"High-confidence transitions were observed between: {', '.join(cams)}.")

        return " ".join(sentences)
