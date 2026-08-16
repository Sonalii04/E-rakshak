"""
Maps FAISS search results back to metadata.
"""

from __future__ import annotations

import pandas as pd

from search.schemas import SearchResult


class MetadataMapper:
    """
    Converts FAISS indices into SearchResult objects.
    """

    def __init__(
        self,
        metadata: pd.DataFrame,
    ) -> None:

        self.metadata = metadata.reset_index(
    drop=True
)

    def map_results(
        self,
        indices,
        scores,
    ) -> list[SearchResult]:

        results = []

        for idx, score in zip(indices, scores):

            if idx < 0:
                continue
            if idx >= len(self.metadata):
                continue
            row = self.metadata.iloc[idx]

            results.append(

    SearchResult(

        track_id=row["track_id"],

        camera_id=row["camera_id"],

        class_name=row["class"],

        category=row["category"],

        detected_type=row["detected_type"],

        vehicle_type=row["vehicle_type"],

        vehicle_number=row.get("vehicle_number", ""),

        color=row["color"],

        upper_body=row["upper_body"],

        lower_body=row["lower_body"],

        first_seen_time=row["first_seen"],

        last_seen_time=row["last_seen"],

        duration=float(row["duration"]),

        zone=row["zone"],

        events=row["events"],

        group_size=int(row["group_size"]),

        near_vehicle=row.get("near_vehicle", ""),

        description=row["description"],

        vlm_description=row["vlm_description"],

        similarity_score=float(score),

        clip_score=float(score),

        final_score=float(score),

    )

)

        return results