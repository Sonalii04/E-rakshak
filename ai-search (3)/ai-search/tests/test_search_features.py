"""
Comprehensive unit tests for the Smart CCTV Search engine and investigation service features.
"""

from __future__ import annotations
import pytest
import pandas as pd
import numpy as np
from datetime import datetime

from src.search.schemas import FilterConfig, SearchResult
from src.search.query_preprocesser import QueryPreprocessor, normalize_plate
from src.search.filters import ResultFilter, parse_iso_time
from src.search.result_ranker import ResultRanker
from src.search.performance.cache import PerformanceCache
from src.search.investigation.route_builder import RouteBuilder
from src.search.investigation.timeline_builder import TimelineBuilder
from src.search.investigation.lifecycle_analyzer import LifecycleAnalyzer
from src.search.investigation.duplicate_detector import DuplicateDetector
from src.search.investigation.track_merger import TrackMerger
from src.search.investigation.statistics_builder import StatisticsBuilder
from src.search.investigation.summary_builder import SummaryBuilder


def test_plate_normalization():
    assert normalize_plate("MH12 AB 1234") == "MH12AB1234"
    assert normalize_plate("mh-12-ab-1234") == "MH12AB1234"
    assert normalize_plate("") == ""
    assert normalize_plate(None) == ""


def test_query_preprocessor_duration():
    _, filters = QueryPreprocessor.preprocess("objects seen for more than 30 seconds")
    assert filters.min_duration == 30.0

    _, filters_max = QueryPreprocessor.preprocess("objects seen for less than 15 sec")
    assert filters_max.max_duration == 15.0


def test_query_preprocessor_group_size():
    _, filters = QueryPreprocessor.preprocess("group of 5 people")
    assert filters.group_size == 5

    _, filters_min = QueryPreprocessor.preprocess("at least 3 individuals")
    assert filters_min.min_group_size == 3


def test_query_preprocessor_time_windows():
    _, filters = QueryPreprocessor.preprocess("objects entering after 6 PM")
    assert filters.start_time == "18:00:00"

    _, filters_between = QueryPreprocessor.preprocess("between 2 PM and 5:30 PM")
    assert filters_between.start_time == "14:00:00"
    assert filters_between.end_time == "17:30:00"


def test_result_filter_events():
    r1 = SearchResult(
        track_id="t1", camera_id="cam1", class_name="car", category="vehicle",
        detected_type="car", vehicle_type="car", vehicle_number="MH12AB1234",
        color="red", upper_body="", lower_body="", first_seen_time="2026-07-23T14:00:00+00:00",
        last_seen_time="2026-07-23T14:01:00+00:00", duration=60.0, zone="outside",
        events="entered,exited", group_size=1, near_vehicle="", description="red car",
        vlm_description="", similarity_score=0.8
    )
    r2 = SearchResult(
        track_id="t2", camera_id="cam1", class_name="person", category="person",
        detected_type="person", vehicle_type="", vehicle_number="",
        color="", upper_body="blue", lower_body="black", first_seen_time="2026-07-23T14:05:00+00:00",
        last_seen_time="2026-07-23T14:06:00+00:00", duration=60.0, zone="inside",
        events="entered,loitering", group_size=1, near_vehicle="", description="person",
        vlm_description="", similarity_score=0.8
    )

    results = [r1, r2]

    # Filter by single event
    f1 = FilterConfig(event="exited")
    filtered1 = ResultFilter.apply(results, f1)
    assert len(filtered1) == 1
    assert filtered1[0].track_id == "t1"

    # Filter by multiple events
    f2 = FilterConfig(event="entered, loitering")
    filtered2 = ResultFilter.apply(results, f2)
    assert len(filtered2) == 1
    assert filtered2[0].track_id == "t2"


def test_result_ranker():
    r1 = SearchResult(
        track_id="t1", camera_id="cam1", class_name="car", category="vehicle",
        detected_type="car", vehicle_type="car", vehicle_number="MH12AB1234",
        color="red", upper_body="", lower_body="", first_seen_time="2026-07-23T14:00:00",
        last_seen_time="2026-07-23T14:01:00", duration=60.0, zone="outside",
        events="entered", group_size=1, near_vehicle="", description="red sedan",
        vlm_description="", similarity_score=0.5
    )
    r2 = SearchResult(
        track_id="t2", camera_id="cam1", class_name="car", category="vehicle",
        detected_type="car", vehicle_type="car", vehicle_number="MH12CD5678",
        color="blue", upper_body="", lower_body="", first_seen_time="2026-07-23T14:00:00",
        last_seen_time="2026-07-23T14:01:00", duration=60.0, zone="outside",
        events="entered", group_size=1, near_vehicle="", description="blue sedan",
        vlm_description="", similarity_score=0.8
    )

    results = [r1, r2]
    # Standard ranking on query
    ranked = ResultRanker.rank(results, query="red sedan")
    # r1 should rank higher because description matches "red sedan", despite lower CLIP score
    assert ranked[0].track_id == "t1"


def test_route_builder():
    r1 = SearchResult(
        track_id="t1", camera_id="cam1", class_name="car", category="vehicle",
        detected_type="car", vehicle_type="car", vehicle_number="MH12AB1234",
        color="red", upper_body="", lower_body="", first_seen_time="2026-07-23T14:00:00+00:00",
        last_seen_time="2026-07-23T14:01:00+00:00", duration=60.0, zone="outside",
        events="entered", group_size=1, near_vehicle="", description="",
        vlm_description="", similarity_score=0.5
    )
    r2 = SearchResult(
        track_id="t2", camera_id="cam2", class_name="car", category="vehicle",
        detected_type="car", vehicle_type="car", vehicle_number="MH12AB1234",
        color="red", upper_body="", lower_body="", first_seen_time="2026-07-23T14:02:00+00:00",
        last_seen_time="2026-07-23T14:03:00+00:00", duration=60.0, zone="outside",
        events="entered", group_size=1, near_vehicle="", description="",
        vlm_description="", similarity_score=0.8
    )

    route_data = RouteBuilder.build([r2, r1])  # deliberately pass unsorted
    assert len(route_data["route_nodes"]) == 2
    # Should be sorted chronologically
    assert route_data["route_nodes"][0]["camera_id"] == "cam1"
    assert route_data["route_nodes"][1]["camera_id"] == "cam2"

    assert len(route_data["transitions"]) == 1
    assert route_data["transitions"][0]["from_camera"] == "cam1"
    assert route_data["transitions"][0]["to_camera"] == "cam2"
    assert route_data["transitions"][0]["confidence"] == "high"  # transition within 1 min (60s)


def test_statistics_builder():
    r1 = SearchResult(
        track_id="t1", camera_id="cam1", class_name="car", category="vehicle",
        detected_type="car", vehicle_type="car", vehicle_number="MH12AB1234",
        color="red", upper_body="", lower_body="", first_seen_time="2026-07-23T14:00:00+00:00",
        last_seen_time="2026-07-23T14:01:00+00:00", duration=60.0, zone="outside",
        events="entered,exited", group_size=1, near_vehicle="", description="",
        vlm_description="", similarity_score=0.5
    )
    r2 = SearchResult(
        track_id="t2", camera_id="cam2", class_name="car", category="vehicle",
        detected_type="car", vehicle_type="car", vehicle_number="MH12AB1234",
        color="red", upper_body="", lower_body="", first_seen_time="2026-07-23T14:02:00+00:00",
        last_seen_time="2026-07-23T14:03:00+00:00", duration=60.0, zone="outside",
        events="entered", group_size=2, near_vehicle="", description="",
        vlm_description="", similarity_score=0.8
    )

    stats = StatisticsBuilder.build([r1, r2])
    assert stats["total_matches"] == 2
    assert stats["colors"]["red"] == 2
    assert stats["events"]["entered"] == 2
    assert stats["events"]["exited"] == 1
    assert stats["group_size_stats"]["max"] == 2
