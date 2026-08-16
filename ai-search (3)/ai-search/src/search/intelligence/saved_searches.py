"""
Abstract storage for saved search definitions.
"""

from __future__ import annotations
import json
from datetime import datetime
from pathlib import Path


class SavedSearches:
    _saved_file = Path("data/saved_searches.json")

    @classmethod
    def save(cls, name: str, query: str, filters: dict, description: str = "") -> dict:
        """
        Saves a query definition for future execution.
        """
        cls._saved_file.parent.mkdir(parents=True, exist_ok=True)
        
        saved = cls.get_all()
        item = {
            "name": name,
            "query": query,
            "filters": filters,
            "created_at": datetime.utcnow().isoformat(),
            "description": description
        }
        saved.append(item)

        with open(cls._saved_file, "w", encoding="utf-8") as f:
            json.dump(saved, f, indent=4)
        return item

    @classmethod
    def get_all(cls) -> list[dict]:
        if not cls._saved_file.exists():
            return []
        try:
            with open(cls._saved_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    @classmethod
    def delete(cls, name: str) -> bool:
        saved = cls.get_all()
        filtered = [s for s in saved if s["name"].lower() != name.lower()]
        if len(filtered) == len(saved):
            return False
        with open(cls._saved_file, "w", encoding="utf-8") as f:
            json.dump(filtered, f, indent=4)
        return True
