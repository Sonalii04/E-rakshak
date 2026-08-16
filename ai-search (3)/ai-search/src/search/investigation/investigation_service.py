"""
Orchestrator for route reconstruction, timeline, duplicates, mergers, and statistics in CCTV investigations.
"""

from __future__ import annotations
from search.investigation.route_builder import RouteBuilder
from search.investigation.timeline_builder import TimelineBuilder
from search.investigation.lifecycle_analyzer import LifecycleAnalyzer
from search.investigation.duplicate_detector import DuplicateDetector
from search.investigation.track_merger import TrackMerger
from search.investigation.statistics_builder import StatisticsBuilder
from search.investigation.summary_builder import SummaryBuilder


class InvestigationService:

    @staticmethod
    def analyze(tracks: list) -> dict:
        """
        Runs complete post-search investigation intelligence suite on matching tracks.
        """
        if not tracks:
            return {
                "summary": "No observations found.",
                "tracks": [],
                "cameras": [],
                "timeline": [],
                "route": [],
                "camera_transitions": [],
                "events": [],
                "lifecycle": [],
                "duplicates": [],
                "merged_tracks": [],
                "statistics": {}
            }

        # 1. Statistics
        stats = StatisticsBuilder.build(tracks)

        # 2. Route Reconstruction & Transitions
        route_data = RouteBuilder.build(tracks)

        # 3. Timeline
        timeline = TimelineBuilder.build(tracks)

        # 4. Lifecycle Analysis
        lifecycle = LifecycleAnalyzer.analyze(tracks)

        # 5. Duplicate Detection
        duplicates = DuplicateDetector.detect(tracks)

        # 6. Track Merging
        merged = TrackMerger.merge(tracks)

        # 7. Summary
        summary = SummaryBuilder.build(stats, route_data)

        # Helper collections
        unique_track_ids = list(set(getattr(t, "track_id", "") for t in tracks if getattr(t, "track_id", "")))
        unique_cameras = list(set(getattr(t, "camera_id", "") for t in tracks if getattr(t, "camera_id", "")))
        unique_events = list(stats.get("events", {}).keys())

        return {
            "summary": summary,
            "tracks": unique_track_ids,
            "cameras": unique_cameras,
            "timeline": timeline,
            "route": route_data.get("route_nodes", []),
            "camera_transitions": route_data.get("transitions", []),
            "events": unique_events,
            "lifecycle": lifecycle,
            "duplicates": duplicates,
            "merged_tracks": merged,
            "statistics": stats
        }
