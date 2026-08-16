"""
Custom exceptions used across the Smart CCTV Search project.
"""


class SearchError(Exception):
    """Base exception for all search-related errors."""


class QueryParseError(SearchError):
    """Raised when a search query cannot be successfully parsed."""


class IndexError(SearchError):
    """Base exception for all FAISS index-related errors."""


class IndexBuildError(IndexError):
    """Raised when the FAISS index cannot be built."""


class IndexLoadError(IndexError):
    """Raised when a FAISS index cannot be loaded."""


class InvestigationError(SearchError):
    """Raised when an investigation or route reconstruction fails."""


class EmbeddingError(Exception):
    """Base exception for embedding-related errors."""


class InvalidEmbeddingError(EmbeddingError):
    """Raised when generated embeddings fail validation."""


class ImageLoadingError(Exception):
    """Raised when an image cannot be loaded."""


class MetadataError(Exception):
    """Raised when metadata is invalid or missing."""