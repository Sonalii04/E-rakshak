"""
Hybrid Result Ranking.
"""

import re
from search.query_preprocesser import QueryPreprocessor, normalize_plate


def text_match_score(query: str, text: str) -> float:
    if not query or not text:
        return 0.0
    query_clean = re.sub(r'[^a-zA-Z0-9\s]', '', query).lower()
    text_clean = re.sub(r'[^a-zA-Z0-9\s]', '', text).lower()
    q_words = [w for w in query_clean.split() if len(w) > 2]
    if not q_words:
        return 1.0 if query_clean in text_clean else 0.0
    matches = sum(1 for w in q_words if w in text_clean)
    return matches / len(q_words)


class ResultRanker:

    # Default weights
    SEMANTIC_WEIGHT = 0.40
    METADATA_WEIGHT = 0.25
    DESCRIPTION_WEIGHT = 0.15
    VLM_WEIGHT = 0.10
    EVENT_WEIGHT = 0.05
    VEHICLE_NUMBER_WEIGHT = 0.05

    @staticmethod
    def rank(results, query=None, config=None, parsed_filters=None):
        if not results:
            return []

        # Load weights from config if available
        weights = {}
        cfg = None
        if config:
            try:
                cfg = config.get("ranking")
            except KeyError:
                cfg = None

        if cfg:
            weights["semantic"] = cfg.get("semantic_weight", ResultRanker.SEMANTIC_WEIGHT)
            weights["metadata"] = cfg.get("metadata_weight", ResultRanker.METADATA_WEIGHT)
            weights["description"] = cfg.get("description_weight", ResultRanker.DESCRIPTION_WEIGHT)
            weights["vlm"] = cfg.get("vlm_weight", ResultRanker.VLM_WEIGHT)
            weights["event"] = cfg.get("event_weight", ResultRanker.EVENT_WEIGHT)
            weights["vehicle_number"] = cfg.get("vehicle_number_weight", ResultRanker.VEHICLE_NUMBER_WEIGHT)
        else:
            weights["semantic"] = ResultRanker.SEMANTIC_WEIGHT
            weights["metadata"] = ResultRanker.METADATA_WEIGHT
            weights["description"] = ResultRanker.DESCRIPTION_WEIGHT
            weights["vlm"] = ResultRanker.VLM_WEIGHT
            weights["event"] = ResultRanker.EVENT_WEIGHT
            weights["vehicle_number"] = ResultRanker.VEHICLE_NUMBER_WEIGHT

        if not query:
            for r in results:
                r.semantic_score = float(r.similarity_score)
                r.metadata_score = 0.0
                r.description_score = 0.0
                r.vlm_score = 0.0
                r.event_score = 0.0
                r.vehicle_number_score = 0.0
                r.final_score = r.similarity_score
            return sorted(results, key=lambda x: (x.final_score, x.track_id), reverse=True)

        if not parsed_filters:
            _, parsed_filters = QueryPreprocessor.preprocess(query)

        for r in results:
            # 1. Semantic Score (CLIP)
            sem_score = max(0.0, min(1.0, float(r.similarity_score)))

            # 2. Metadata Overlap Score
            meta_score = 0.0
            active_fields = 0

            # Match components
            if parsed_filters.camera_id:
                active_fields += 1
                if getattr(r, "camera_id", "").strip().lower() == parsed_filters.camera_id.strip().lower():
                    meta_score += 1.0

            if parsed_filters.category:
                active_fields += 1
                if getattr(r, "category", "").strip().lower() == parsed_filters.category.strip().lower():
                    meta_score += 1.0

            if parsed_filters.detected_type:
                active_fields += 1
                if getattr(r, "detected_type", "").strip().lower() == parsed_filters.detected_type.strip().lower():
                    meta_score += 1.0

            if parsed_filters.vehicle_type:
                active_fields += 1
                if getattr(r, "vehicle_type", "").strip().lower() == parsed_filters.vehicle_type.strip().lower():
                    meta_score += 1.0

            if parsed_filters.color:
                active_fields += 1
                if getattr(r, "color", "").strip().lower() == parsed_filters.color.strip().lower():
                    meta_score += 1.0

            if parsed_filters.upper_body:
                active_fields += 1
                if getattr(r, "upper_body", "").strip().lower() == parsed_filters.upper_body.strip().lower():
                    meta_score += 1.0

            if parsed_filters.lower_body:
                active_fields += 1
                if getattr(r, "lower_body", "").strip().lower() == parsed_filters.lower_body.strip().lower():
                    meta_score += 1.0

            if parsed_filters.zone:
                active_fields += 1
                if getattr(r, "zone", "").strip().lower() == parsed_filters.zone.strip().lower():
                    meta_score += 1.0

            if parsed_filters.near_vehicle:
                active_fields += 1
                if getattr(r, "near_vehicle", "").strip().lower() == parsed_filters.near_vehicle.strip().lower():
                    meta_score += 1.0

            if parsed_filters.group_size is not None:
                active_fields += 1
                if getattr(r, "group_size", 0) == parsed_filters.group_size:
                    meta_score += 1.0

            # Compute normalized metadata score
            norm_meta_score = (meta_score / active_fields) if active_fields > 0 else 1.0

            # 3. Description text matching
            desc_score = text_match_score(query, getattr(r, "description", ""))

            # 4. VLM description matching
            vlm_score = text_match_score(query, getattr(r, "vlm_description", ""))

            # 5. Event score
            ev_score = 0.0
            if parsed_filters.event:
                q_events = [e.strip().lower() for e in re.split(r'[,\s]+', parsed_filters.event) if e.strip()]
                r_events = [e.strip().lower() for e in getattr(r, "events", "").split(",") if e.strip()]
                if q_events and all(any(qe in re_val for re_val in r_events) for qe in q_events):
                    ev_score = 1.0

            # 6. Vehicle number score
            vn_score = 0.0
            if parsed_filters.vehicle_number:
                norm_filter_plate = normalize_plate(parsed_filters.vehicle_number)
                norm_track_plate = normalize_plate(getattr(r, "vehicle_number", ""))
                if norm_filter_plate and norm_filter_plate in norm_track_plate:
                    vn_score = 1.0

            # Combine weighted components
            final = (
                weights["semantic"] * sem_score +
                weights["metadata"] * norm_meta_score +
                weights["description"] * desc_score +
                weights["vlm"] * vlm_score +
                weights["event"] * ev_score +
                weights["vehicle_number"] * vn_score
            )

            # --------------------
            # Boosts for Exact Matches
            # --------------------
            # Track ID exact match receives massive boost (+100.0)
            if parsed_filters.track_id:
                if getattr(r, "track_id", "").strip().lower() == parsed_filters.track_id.strip().lower():
                    final += 100.0

            # Vehicle Number exact match receives massive boost (+50.0)
            if parsed_filters.vehicle_number:
                norm_filter_plate = normalize_plate(parsed_filters.vehicle_number)
                norm_track_plate = normalize_plate(getattr(r, "vehicle_number", ""))
                if norm_filter_plate and norm_filter_plate == norm_track_plate:
                    final += 50.0

            # Expose scores
            r.semantic_score = round(sem_score, 4)
            r.metadata_score = round(norm_meta_score, 4)
            r.description_score = round(desc_score, 4)
            r.vlm_score = round(vlm_score, 4)
            r.event_score = round(ev_score, 4)
            r.vehicle_number_score = round(vn_score, 4)
            r.final_score = round(final, 4)

        return sorted(results, key=lambda x: (x.final_score, x.track_id), reverse=True)