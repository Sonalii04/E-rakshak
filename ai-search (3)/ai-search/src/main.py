import argparse
import json
from configs.config import Config
from core.device import DeviceManager
from core.logger import get_logger

from embedding.service import EmbeddingService
from embedding.model_loader import OpenCLIPLoader

from search.index_service import IndexService
from search.search_engine import SearchEngine
from search.schemas import (
    SearchRequest,
    FilterConfig,
)
from search.similar.similar_object_search import SimilarObjectSearch


def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(

        "mode",

        choices=[
            "embed",
            "build-index",
            "search",
            "similar",
        ],

    )

    parser.add_argument(

        "query",

        nargs="?",

        default=None,

    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Return JSON output",
    )
    parser.add_argument(
        "--filters-json",
        type=str,
        default=None,
        help="JSON string representing FilterConfig"
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=None,
        help="Override top_k results count"
    )
    args = parser.parse_args()

    config = Config()

    logger = get_logger(

        "main",

        config.get("paths","log_dir"),)

    device = DeviceManager.get_device()

    logger.info(
        f"Using Device : {device}"
    )
    if args.mode in ("embed", "search", "similar"):
        bundle = OpenCLIPLoader(
            model_name=config.get("model", "name"),
            pretrained=config.get("model", "pretrained"),
            device=device,
        ).load()
        if args.mode == "embed":

            service = EmbeddingService(
                config=config,
                bundle=bundle,
                device=device,
                logger=logger,
            )

            service.run()
        elif args.mode == "search":

            if args.query is None and not args.filters_json:

                raise ValueError(
                    "Search query missing."
                )

            engine = SearchEngine(
                config=config,
                bundle=bundle,
                device=device,
            )

            filters = FilterConfig()
            if args.filters_json:
                try:
                    f_data = json.loads(args.filters_json)
                    for k, v in f_data.items():
                        if hasattr(filters, k):
                            setattr(filters, k, v)
                except Exception as e:
                    logger.error(f"Failed to parse filters-json: {e}")

            top_k_val = args.top_k if args.top_k is not None else config.get("search", "top_k")

            request = SearchRequest(
                query=args.query or "",
                top_k=top_k_val,
                filters=filters
            )

            response = engine.search(
                request
            )
            results = response["results"]

            def result_to_dict(res):
                return {
                    "track_id": res.track_id,
                    "camera_id": res.camera_id,
                    "class_name": res.class_name,
                    "category": res.category,
                    "detected_type": res.detected_type,
                    "vehicle_type": res.vehicle_type,
                    "vehicle_number": res.vehicle_number,
                    "color": res.color,
                    "upper_body": res.upper_body,
                    "lower_body": res.lower_body,
                    "first_seen_time": res.first_seen_time,
                    "last_seen_time": res.last_seen_time,
                    "duration": res.duration,
                    "zone": res.zone,
                    "events": res.events,
                    "group_size": res.group_size,
                    "near_vehicle": res.near_vehicle,
                    "description": res.description,
                    "vlm_description": res.vlm_description,
                    "similarity_score": res.similarity_score,
                    "clip_score": res.clip_score,
                    "final_score": res.final_score,
                    "semantic_score": res.semantic_score,
                    "metadata_score": res.metadata_score,
                    "description_score": res.description_score,
                    "vlm_score": res.vlm_score,
                    "event_score": res.event_score,
                    "vehicle_number_score": res.vehicle_number_score
                }

            if args.json:
                response_json = {
                    "query": response["query"],
                    "results": [result_to_dict(r) for r in response["results"]],
                    "total_matches": response["total_matches"],
                    "search_metrics": response["search_metrics"],
                    "investigation": response["investigation"]
                }
                print(
                    json.dumps(
                        response_json,
                        indent=4,
                    )
                )

            else:
                print("\nSearch Results")
                print("=" * 80)

                for i, result in enumerate(results, start=1):

                    print(f"\n[{i}]")

                    print(
                        f"Track ID   : {result.track_id}"
                    )

                    print(
                        f"Camera     : {result.camera_id}"
                    )

                    print(
                        f"Class      : {result.class_name}"
                    )

                    print(f"CLIP Score : {result.clip_score:.4f}") 
                    print(f"Final Score: {result.final_score:.4f}")

                    print(
                        f"Time       : "
                        f"{result.first_seen_time}"
                        " -> "
                        f"{result.last_seen_time}"
                    )

                    print(
                        f"Description: {result.description}"
                    )

                print("\nTotal Results :", len(results))
                print("\nInvestigation Summary")
                print("=" * 80)
                print(response["investigation"]["summary"])

        elif args.mode == "similar":
            if args.query is None:
                raise ValueError("Reference track ID is required.")

            engine = SearchEngine(
                config=config,
                bundle=bundle,
                device=device,
            )

            similar_searcher = SimilarObjectSearch(engine)

            top_k_val = args.top_k if args.top_k is not None else 10
            options = {}
            if args.filters_json:
                try:
                    options = json.loads(args.filters_json)
                except Exception as e:
                    logger.error(f"Failed to parse options for similar search: {e}")

            results = similar_searcher.search(
                reference_track_id=args.query,
                top_k=top_k_val,
                same_camera=options.get("same_camera", False),
                different_cameras=options.get("different_cameras", False),
                time_window_seconds=options.get("time_window_seconds", None),
                same_class=options.get("same_class", False),
                same_color=options.get("same_color", False),
                same_vehicle_type=options.get("same_vehicle_type", False),
            )

            def result_to_dict(res):
                return {
                    "track_id": res.track_id,
                    "camera_id": res.camera_id,
                    "class_name": res.class_name,
                    "category": res.category,
                    "detected_type": res.detected_type,
                    "vehicle_type": res.vehicle_type,
                    "vehicle_number": res.vehicle_number,
                    "color": res.color,
                    "upper_body": res.upper_body,
                    "lower_body": res.lower_body,
                    "first_seen_time": res.first_seen_time,
                    "last_seen_time": res.last_seen_time,
                    "duration": res.duration,
                    "zone": res.zone,
                    "events": res.events,
                    "group_size": res.group_size,
                    "near_vehicle": res.near_vehicle,
                    "description": res.description,
                    "vlm_description": res.vlm_description,
                    "similarity_score": res.similarity_score,
                    "clip_score": res.clip_score,
                    "final_score": res.final_score
                }

            if args.json:
                print(json.dumps([result_to_dict(r) for r in results], indent=4))
            else:
                print(f"\nSimilar Objects to '{args.query}':")
                print("=" * 80)
                for i, r in enumerate(results, start=1):
                    print(f"[{i}] Track ID: {r.track_id} | Class: {r.class_name} | Similarity: {r.similarity_score:.4f} | Description: {r.description}")




    elif args.mode == "build-index":

        service = IndexService(
            config=config,
        )

        service.run()

    

if __name__ == "__main__":

    main()