"""
Tracks query metrics and stage latencies.
"""

from __future__ import annotations
import json
from pathlib import Path


class SearchMetrics:
    _metrics_file = Path("data/metrics.json")
    
    # Internal in-memory counters
    _total_searches = 0
    _successful_searches = 0
    _failed_searches = 0
    
    _total_latency_ms = 0.0
    _total_faiss_ms = 0.0
    _total_ranking_ms = 0.0
    _total_filter_ms = 0.0
    _total_investigation_ms = 0.0
    _total_results = 0

    @classmethod
    def record_search(
        cls,
        success: bool,
        latency_ms: float,
        faiss_ms: float = 0.0,
        ranking_ms: float = 0.0,
        filter_ms: float = 0.0,
        investigation_ms: float = 0.0,
        result_count: int = 0
    ):
        cls._total_searches += 1
        if success:
            cls._successful_searches += 1
            cls._total_latency_ms += latency_ms
            cls._total_faiss_ms += faiss_ms
            cls._total_ranking_ms += ranking_ms
            cls._total_filter_ms += filter_ms
            cls._total_investigation_ms += investigation_ms
            cls._total_results += result_count
        else:
            cls._failed_searches += 1
        
        # Persist summary
        cls._save_metrics()

    @classmethod
    def _save_metrics(cls):
        cls._metrics_file.parent.mkdir(parents=True, exist_ok=True)
        stats = cls.get_summary()
        try:
            with open(cls._metrics_file, "w", encoding="utf-8") as f:
                json.dump(stats, f, indent=4)
        except Exception:
            pass

    @classmethod
    def get_summary(cls) -> dict:
        avg_lat = cls._total_latency_ms / cls._successful_searches if cls._successful_searches > 0 else 0.0
        avg_faiss = cls._total_faiss_ms / cls._successful_searches if cls._successful_searches > 0 else 0.0
        avg_ranking = cls._total_ranking_ms / cls._successful_searches if cls._successful_searches > 0 else 0.0
        avg_filter = cls._total_filter_ms / cls._successful_searches if cls._successful_searches > 0 else 0.0
        avg_invest = cls._total_investigation_ms / cls._successful_searches if cls._successful_searches > 0 else 0.0
        avg_results = cls._total_results / cls._successful_searches if cls._successful_searches > 0 else 0.0

        return {
            "total_searches": cls._total_searches,
            "successful_searches": cls._successful_searches,
            "failed_searches": cls._failed_searches,
            "average_search_latency_ms": round(avg_lat, 2),
            "average_faiss_latency_ms": round(avg_faiss, 2),
            "average_ranking_latency_ms": round(avg_ranking, 2),
            "average_filter_latency_ms": round(avg_filter, 2),
            "average_investigation_latency_ms": round(avg_invest, 2),
            "average_result_count": round(avg_results, 1)
        }
