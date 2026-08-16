"""
Abstract storage for search history logs.
"""

from __future__ import annotations
import json
from datetime import datetime
from pathlib import Path


class SearchHistory:
    _history_file = Path("data/history.json")

    @classmethod
    def log(cls, query: str, filters: dict, result_count: int, execution_time_ms: float):
        """
        Logs a search query to local history file.
        """
        cls._history_file.parent.mkdir(parents=True, exist_ok=True)
        
        history = cls.get_all()
        history.append({
            "query": query,
            "timestamp": datetime.utcnow().isoformat(),
            "filters": filters,
            "result_count": result_count,
            "execution_time_ms": execution_time_ms
        })

        with open(cls._history_file, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=4)

    @classmethod
    def get_all(cls) -> list[dict]:
        if not cls._history_file.exists():
            return []
        try:
            with open(cls._history_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    @classmethod
    def get_recent(cls, limit: int = 10) -> list[dict]:
        all_hist = cls.get_all()
        return all_hist[::-1][:limit]

    @classmethod
    def get_trending(cls, limit: int = 5) -> list[dict]:
        """
        Returns trending queries based on search frequency.
        """
        all_hist = cls.get_all()
        if not all_hist:
            return []
        
        from collections import Counter
        queries = [h["query"].strip().lower() for h in all_hist if h.get("query")]
        counts = Counter(queries).most_common(limit)
        return [{"query": q, "count": count} for q, count in counts]
