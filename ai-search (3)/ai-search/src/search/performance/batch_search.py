"""
Implements batch query execution for semantic search.
"""

from __future__ import annotations
from search.schemas import SearchRequest, FilterConfig


class BatchSearch:

    def __init__(self, search_engine) -> None:
        self.search_engine = search_engine

    def execute(self, queries: list[str], top_k: int = 10, filters: FilterConfig = None) -> list[dict]:
        """
        Executes a list of queries in batch, reusing the CLIP model and FAISS resources.
        """
        if filters is None:
            filters = FilterConfig()

        results = []
        for q in queries:
            req = SearchRequest(
                query=q,
                top_k=top_k,
                filters=filters
            )
            # SearchEngine.search will handle this
            res = self.search_engine.search(req)
            results.append({
                "query": q,
                "results": res
            })

        return results
