"""
Search Engine Health Validation.
"""

from __future__ import annotations
from search.performance.cache import PerformanceCache


class SearchHealth:

    @staticmethod
    def check(search_engine) -> dict:
        """
        Validates index and model availability, and metadata/FAISS consistency.
        """
        faiss_loaded = search_engine.faiss.index is not None
        vector_count = search_engine.faiss.ntotal if faiss_loaded else 0
        dimension = search_engine.faiss.dimension if faiss_loaded else 0

        metadata_df = PerformanceCache.get_metadata()
        metadata_count = len(metadata_df) if metadata_df is not None else 0

        model_loaded = search_engine.query_embedder.model is not None

        # Check vector & metadata row count consistency
        consistent = (vector_count == metadata_count)

        status = "healthy"
        errors = []

        if not faiss_loaded:
            status = "unhealthy"
            errors.append("FAISS index not loaded.")
        if not model_loaded:
            status = "unhealthy"
            errors.append("OpenCLIP model not loaded.")
        if not consistent:
            status = "unhealthy"
            errors.append(f"Consistency error: metadata rows ({metadata_count}) != embedding vector count ({vector_count}).")

        return {
            "status": status,
            "faiss_loaded": faiss_loaded,
            "vector_count": vector_count,
            "embedding_dimension": dimension,
            "metadata_count": metadata_count,
            "consistency_ok": consistent,
            "model_loaded": model_loaded,
            "errors": errors
        }
