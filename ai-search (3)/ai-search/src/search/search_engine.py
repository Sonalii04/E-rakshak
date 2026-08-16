"""
Semantic Search Engine.
"""

from __future__ import annotations
import json
import re
from pathlib import Path
from time import perf_counter

import pandas as pd
from core.logger import get_logger
from core.exceptions import IndexLoadError, SearchError

from search.schemas import SearchRequest, SearchResult, FilterConfig
from search.constants import SIMILARITY_THRESHOLD
from search.query_embedder import QueryEmbedder
from search.query_expander import QueryExpander
from search.query_preprocesser import QueryPreprocessor
from search.metadata_mapper import MetadataMapper
from search.filters import ResultFilter
from search.result_ranker import ResultRanker
from search.diversifier import Diversifier
from search.faiss_manager import FAISSManager

# Custom optimization and monitoring imports
from search.performance.cache import PerformanceCache
from search.investigation.investigation_service import InvestigationService
from search.monitoring.metrics import SearchMetrics
from search.monitoring.health import SearchHealth
from search.intelligence.search_history import SearchHistory


class SearchEngine:

    def __init__(
        self,
        config,
        bundle,
        device,
    ):
        self.config = config
        self.threshold = SIMILARITY_THRESHOLD
        self.logger = get_logger(
            "search",
            config.get("paths", "log_dir"),
        )

        self.query_embedder = QueryEmbedder(
            bundle,
            device,
        )

        self.faiss = FAISSManager(config)
        self.faiss.load(config.get("paths", "faiss_index"))
        self._verify_index()

        # Initialize PerformanceCache
        PerformanceCache.initialize(config)
        self.mapper = MetadataMapper(PerformanceCache.get_metadata())

    def search(
        self,
        request: SearchRequest,
    ) -> dict:
        """
        Executes multi-stage search, including candidate retrieval, filtering, ranking,
        and full investigation intelligence generation.
        """
        start = perf_counter()
        
        # 1. Limit top_k and query length to protect against DoS
        request.top_k = min(max(1, request.top_k), 100)
        if len(request.query) > 500:
            raise ValueError("Query query is too long.")

        candidate_pool = min(
            max(request.top_k * 10, self.config.get("search", "candidate_pool")),
            self.faiss.ntotal,
        )

        # 2. Derive dynamic vocabulary from cache metadata
        metadata_df = PerformanceCache.get_metadata()
        vocab = {
            "tracks": set(metadata_df["track_id"].dropna().unique()),
            "cameras": set(metadata_df["camera_id"].dropna().unique()),
            "zones": set(metadata_df["zone"].dropna().unique()),
            "colors": set(metadata_df["color"].dropna().unique()),
            "categories": set(metadata_df["category"].dropna().unique()),
            "detected_types": set(metadata_df["detected_type"].dropna().unique()),
            "vehicle_types": set(metadata_df["vehicle_type"].dropna().unique()),
            "vehicle_numbers": set(metadata_df["vehicle_number"].dropna().unique()),
        }
        events = set()
        for evs in metadata_df["events"].dropna():
            for ev in evs.split(","):
                if ev.strip():
                    events.add(ev.strip().lower())
        vocab["events"] = events

        # 3. Query Preprocessing & Intent Extraction
        t_pre_start = perf_counter()
        query, parsed_filters = QueryPreprocessor.preprocess(request.query, vocabulary=vocab)
        pre_latency = (perf_counter() - t_pre_start) * 1000.0

        # Merge requested filters and parsed filters (request filters have priority)
        filters = request.filters
        if filters.track_id is None:
            filters.track_id = parsed_filters.track_id
        if filters.camera_id is None:
            filters.camera_id = parsed_filters.camera_id
        if filters.category is None:
            filters.category = parsed_filters.category
        if filters.detected_type is None:
            filters.detected_type = parsed_filters.detected_type
        if filters.vehicle_type is None:
            filters.vehicle_type = parsed_filters.vehicle_type
        if filters.vehicle_number is None:
            filters.vehicle_number = parsed_filters.vehicle_number
        if filters.color is None:
            filters.color = parsed_filters.color
        if filters.upper_body is None:
            filters.upper_body = parsed_filters.upper_body
        if filters.lower_body is None:
            filters.lower_body = parsed_filters.lower_body
        if filters.zone is None:
            filters.zone = parsed_filters.zone
        if filters.event is None:
            filters.event = parsed_filters.event
        if filters.group_size is None:
            filters.group_size = parsed_filters.group_size
        if filters.min_group_size is None:
            filters.min_group_size = parsed_filters.min_group_size
        if filters.max_group_size is None:
            filters.max_group_size = parsed_filters.max_group_size
        if filters.min_duration is None:
            filters.min_duration = parsed_filters.min_duration
        if filters.max_duration is None:
            filters.max_duration = parsed_filters.max_duration
        if filters.start_time is None:
            filters.start_time = parsed_filters.start_time
        if filters.end_time is None:
            filters.end_time = parsed_filters.end_time
        if filters.near_vehicle is None:
            filters.near_vehicle = parsed_filters.near_vehicle

        results = []
        faiss_latency = 0.0
        filter_latency = 0.0
        ranking_latency = 0.0
        invest_latency = 0.0

        # Stage 1: Fast O(1) indexed lookup if track ID or vehicle number is specified
        if filters.track_id:
            # Direct track lookup
            t_lookup = PerformanceCache.get_track_by_id(filters.track_id)
            if t_lookup:
                idx = PerformanceCache.get_idx_by_track_id(filters.track_id)
                results = self.mapper.map_results([idx], [1.0])
        elif filters.vehicle_number:
            # Direct vehicle plate lookup
            matches = PerformanceCache.get_tracks_by_plate(filters.vehicle_number, exact=False)
            if matches:
                indices = [PerformanceCache.get_idx_by_track_id(m["track_id"]) for m in matches]
                scores = [1.0] * len(matches)
                results = self.mapper.map_results(indices, scores)

        # Stage 2: Fall back to FAISS vector search
        if not results and query and query.strip():
            if self.faiss is None or self.faiss.index is None:
                raise IndexLoadError("FAISS index has not been loaded.")

            t_faiss_start = perf_counter()
            expanded_query = QueryExpander.expand(query)
            query_embedding = self.query_embedder.encode(expanded_query)
            scores, indices = self.faiss.search(query_embedding, candidate_pool)
            results = self.mapper.map_results(indices, scores)
            faiss_latency = (perf_counter() - t_faiss_start) * 1000.0

        # Stage 3: Metadata Hard Filters
        t_filt_start = perf_counter()
        results = ResultFilter.apply(results, filters)
        
        # Soft fallback if filters eliminated all results
        if not results and query and query.strip():
            # Retry without hard filters to return semantically closest items
            if filters.track_id or filters.vehicle_number:
                # No fallback for direct ID/plate lookup if not found
                results = []
            else:
                expanded_query = QueryExpander.expand(query)
                query_embedding = self.query_embedder.encode(expanded_query)
                scores, indices = self.faiss.search(query_embedding, candidate_pool)
                results = self.mapper.map_results(indices, scores)
        filter_latency = (perf_counter() - t_filt_start) * 1000.0

        # Stage 4: Hybrid Ranking & Scoring
        t_rank_start = perf_counter()
        results = ResultRanker.rank(results, query=request.query, config=self.config, parsed_filters=filters)
        results = Diversifier.diversify(results)
        ranking_latency = (perf_counter() - t_rank_start) * 1000.0

        # Top K candidates
        top_results = results[:request.top_k]

        # Stage 5: Investigation Analysis
        t_inv_start = perf_counter()
        investigation_data = InvestigationService.analyze(top_results)
        invest_latency = (perf_counter() - t_inv_start) * 1000.0

        elapsed_ms = (perf_counter() - start) * 1000.0

        # Record metrics and log search history
        SearchMetrics.record_search(
            success=True,
            latency_ms=elapsed_ms,
            faiss_ms=faiss_latency,
            ranking_ms=ranking_latency,
            filter_ms=filter_latency,
            investigation_ms=invest_latency,
            result_count=len(top_results)
        )

        # Log query history
        filters_logged = {k: getattr(filters, k) for k in filters.__slots__ if getattr(filters, k) is not None}
        SearchHistory.log(request.query, filters_logged, len(top_results), elapsed_ms)

        # Return structured API response
        return {
            "query": request.query,
            "results": top_results,
            "total_matches": len(results),
            "search_metrics": {
                "latency_ms": round(elapsed_ms, 2),
                "faiss_ms": round(faiss_latency, 2),
                "filter_ms": round(filter_latency, 2),
                "ranking_ms": round(ranking_latency, 2),
                "investigation_ms": round(invest_latency, 2),
            },
            "investigation": investigation_data
        }

    def _verify_index(
        self,
    ):
        info_path = Path(self.config.get("paths", "index_dir")) / "index_info.json"
        with open(info_path, encoding="utf-8") as file:
            info = json.load(file)

        expected = self.config.get("faiss", "dimension")
        if info["dimension"] != expected:
            raise ValueError("Embedding dimension mismatch.")

        if info["metric"] != "Inner Product":
            raise ValueError("Unsupported FAISS metric.")

    def health(self):
        return SearchHealth.check(self)