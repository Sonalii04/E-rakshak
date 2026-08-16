"""
Dataclasses used by the semantic search module.
"""

from dataclasses import dataclass
from typing import Optional


@dataclass(slots=True)
class FilterConfig:

    camera_id: Optional[str] = None

    category: Optional[str] = None

    detected_type: Optional[str] = None

    vehicle_type: Optional[str] = None

    vehicle_number: Optional[str] = None

    color: Optional[str] = None

    upper_body: Optional[str] = None

    lower_body: Optional[str] = None

    zone: Optional[str] = None
    group_size: Optional[int] = None
    min_group_size: Optional[int] = None
    max_group_size: Optional[int] = None

    near_vehicle: Optional[str] = None
    event: Optional[str] = None

    min_duration: Optional[float] = None

    max_duration: Optional[float] = None

    start_time: Optional[str] = None

    end_time: Optional[str] = None

    track_id: Optional[str] = None


@dataclass(slots=True)
class SearchRequest:
    """
    Represents a user search request.
    """

    query: str
    top_k: int
    filters: FilterConfig


@dataclass(slots=True)
class SearchResult:

    track_id: str

    camera_id: str

    class_name: str

    category: str

    detected_type: str

    vehicle_type: str

    vehicle_number: str

    color: str

    upper_body: str

    lower_body: str

    first_seen_time: str

    last_seen_time: str

    duration: float

    zone: str

    events: str

    group_size: int

    near_vehicle: str

    description: str

    vlm_description: str

    similarity_score: float

    clip_score: float = 0.0

    final_score: float = 0.0

    semantic_score: float = 0.0

    metadata_score: float = 0.0

    description_score: float = 0.0

    vlm_score: float = 0.0

    event_score: float = 0.0

    vehicle_number_score: float = 0.0