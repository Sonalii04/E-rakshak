"""
Query preprocessing and metadata extraction.
"""

import re
from search.schemas import FilterConfig


def normalize_plate(plate: str) -> str:
    if not plate:
        return ""
    return re.sub(r'[^A-Za-z0-9]', '', plate).upper()



class QueryPreprocessor:

    COLOR_SYNONYMS = {
        "white": ["white", "ivory", "cream"],
        "black": ["black", "dark"],
        "gray": ["gray", "grey", "silver"],
        "blue": ["blue", "navy"],
        "red": ["red", "maroon"],
        "green": ["green"],
        "yellow": ["yellow"],
        "orange": ["orange"],
        "brown": ["brown"],
        "beige": ["beige", "tan"],
        "purple": ["purple"],
        "pink": ["pink"],
        "gold": ["gold"],
    }

    QUERY_EXPANSIONS = {
        "dark": [
            "black",
            "navy",
        ],
        "light": [
            "white",
            "silver",
            "gray",
        ],
        "vehicle": [
            "car",
            "automobile",
        ],
        "person": [
            "human",
            "man",
            "woman",
        ],
        "motorbike": [
            "motorcycle",
            "bike",
        ],
    }

    OBJECT_SYNONYMS = {
        "car": [
            "car",
            "cars",
            "vehicle",
            "vehicles",
            "automobile",
        ],
        "motorcycle": [
            "motorcycle",
            "bike",
            "bikes",
            "scooter",
        ],
        "truck": [
            "truck",
            "lorry",
        ],
        "bus": [
            "bus",
        ],
        "person": [
            "person",
            "people",
            "man",
            "woman",
            "boy",
            "girl",
            "human",
        ],
    }

    VEHICLE_TYPES = {
        "sedan",
        "suv",
        "hatchback",
        "pickup",
        "truck",
        "bus",
        "motorcycle",
    }

    CATEGORIES = {
        "vehicle",
        "person",
    }

    ZONES = {
        "outside",
        "inside",
        "entry",
        "exit",
        "gate",
        "parking",
        "road",
        "platform",
        "depot",
    }

    EVENTS = {
        "entered",
        "exited",
        "parked",
        "moving",
        "stopped",
        "waiting",
        "standing",
    }

    BODY_COLORS = {
        "white",
        "black",
        "blue",
        "red",
        "green",
        "yellow",
        "gray",
        "grey",
        "brown",
        "orange",
        "purple",
        "pink",
        "beige",
    }

    @classmethod
    def preprocess(cls, query: str, vocabulary: dict = None):
        query = query.lower().strip()
        expanded = query

        # Common expansion rules (generic)
        if "dark vehicle" in expanded:
            expanded += " black car"
        if "light vehicle" in expanded:
            expanded += " white car"
        if "automobile" in expanded:
            expanded += " car"
        if "bike" in expanded:
            expanded += " motorcycle"

        filters = FilterConfig()

        # -------------------------
        # Regex / Structural Extractions
        # -------------------------
        # Duration
        duration_match = re.search(
            r"(?:over|more than|longer than|for over|at least|for)\s*(\d+(?:\.\d+)?)\s*(seconds|second|sec|s)",
            query,
        )
        if duration_match:
            filters.min_duration = float(duration_match.group(1))

        duration_max_match = re.search(
            r"(?:less than|under|within|for less than)\s*(\d+(?:\.\d+)?)\s*(seconds|second|sec|s)",
            query,
        )
        if duration_max_match:
            filters.max_duration = float(duration_max_match.group(1))

        # Group Size
        group_match = re.search(
            r"(?:group of|at least|min)?\s*(\d+)\s*(people|persons|person|individuals|objects)",
            query,
        )
        if group_match:
            val = int(group_match.group(1))
            if "at least" in query or "min" in query:
                filters.min_group_size = val
            elif "at most" in query or "max" in query:
                filters.max_group_size = val
            else:
                filters.group_size = val

        # Time Window
        def parse_hour_min_period(h_str, m_str, p_str):
            h = int(h_str)
            m = int(m_str) if m_str else 0
            p = p_str.lower() if p_str else ""
            if p == "pm" and h < 12:
                h += 12
            elif p == "am" and h == 12:
                h = 0
            # format as HH:MM:SS
            return f"{h:02d}:{m:02d}:00"

        between_match = re.search(
            r"\bbetween\s*(\d{1,2})(?:\s*:\s*(\d{2}))?\s*(am|pm)?\s*and\s*(\d{1,2})(?:\s*:\s*(\d{2}))?\s*(am|pm)?",
            query
        )
        if between_match:
            filters.start_time = parse_hour_min_period(between_match.group(1), between_match.group(2), between_match.group(3))
            filters.end_time = parse_hour_min_period(between_match.group(4), between_match.group(5), between_match.group(6))
        else:
            after_match = re.search(r"\bafter\s*(\d{1,2})(?:\s*:\s*(\d{2}))?\s*(am|pm)?", query)
            if after_match:
                filters.start_time = parse_hour_min_period(after_match.group(1), after_match.group(2), after_match.group(3))
            before_match = re.search(r"\bbefore\s*(\d{1,2})(?:\s*:\s*(\d{2}))?\s*(am|pm)?", query)
            if before_match:
                filters.end_time = parse_hour_min_period(before_match.group(1), before_match.group(2), before_match.group(3))

        # Near Vehicle
        near_match = re.search(r"\bnear\s+([a-zA-Z0-9_\-]+)", query)
        if near_match:
            filters.near_vehicle = near_match.group(1)

        # -------------------------
        # Dynamic Vocabulary Matching
        # -------------------------
        if vocabulary:
            words = set(re.findall(r"\w+", query))

            # 1. Track ID
            if "tracks" in vocabulary:
                for w in words:
                    if w in vocabulary["tracks"]:
                        filters.track_id = w
                        break
            
            if not filters.track_id:
                track_id_pattern = re.search(r"\b[a-zA-Z0-9_]+_[0-9]{3,7}\b", query)
                if track_id_pattern:
                    filters.track_id = track_id_pattern.group()

            # 2. Vehicle Number (Plate)
            if "vehicle_numbers" in vocabulary:
                normalized_query = re.sub(r'[^A-Za-z0-9]', '', query).upper()
                for plate in vocabulary["vehicle_numbers"]:
                    norm_p = re.sub(r'[^A-Za-z0-9]', '', plate).upper()
                    if norm_p and norm_p in normalized_query:
                        filters.vehicle_number = plate
                        break
            
            if not filters.vehicle_number:
                plate_match = re.search(r"\b(?=[A-Za-z]*[0-9])(?=[0-9]*[A-Za-z])[A-Za-z0-9\-]{5,15}\b", query.upper())
                if plate_match:
                    filters.vehicle_number = plate_match.group()

            # 3. Camera
            if "cameras" in vocabulary:
                for cam in vocabulary["cameras"]:
                    if cam.lower() in query:
                        filters.camera_id = cam
                        break

            # 4. Zone
            if "zones" in vocabulary:
                for zone in vocabulary["zones"]:
                    if zone.lower() in query:
                        filters.zone = zone
                        break

            # 5. Event
            if "events" in vocabulary:
                found_events = []
                for ev in vocabulary["events"]:
                    if ev.lower() in query:
                        found_events.append(ev)
                if found_events:
                    filters.event = ",".join(found_events)

            # 6. Category
            if "categories" in vocabulary:
                for cat in vocabulary["categories"]:
                    if cat.lower() in words:
                        filters.category = cat
                        break

            # 7. Detected Type
            if "detected_types" in vocabulary:
                for dt in vocabulary["detected_types"]:
                    if dt.lower() in query:
                        filters.detected_type = dt
                        break

            # 8. Vehicle Type
            if "vehicle_types" in vocabulary:
                for vt in vocabulary["vehicle_types"]:
                    if vt.lower() in query:
                        filters.vehicle_type = vt
                        break

            # 9. Color / Upper & Lower Body
            found_colors = []
            if "colors" in vocabulary:
                for col in vocabulary["colors"]:
                    if col.lower() in query:
                        found_colors.append(col)
            
            for canonical, synonyms in cls.COLOR_SYNONYMS.items():
                if any(syn in words for syn in synonyms):
                    if canonical not in found_colors:
                        found_colors.append(canonical)
            
            if found_colors:
                upper_match = re.search(r"\b(shirt|tshirt|jacket|top|saree)\b", query)
                lower_match = re.search(r"\b(pant|pants|jeans|trouser|trousers|skirt)\b", query)
                
                for color in found_colors:
                    color_pattern_upper = re.search(rf"\b{color}\b.*\b(shirt|tshirt|jacket|top|saree)\b", query)
                    color_pattern_lower = re.search(rf"\b{color}\b.*\b(pant|pants|jeans|trouser|trousers|skirt)\b", query)
                    if color_pattern_upper:
                        filters.upper_body = color
                    if color_pattern_lower:
                        filters.lower_body = color
                
                if not filters.upper_body and upper_match:
                    filters.upper_body = found_colors[0]
                if not filters.lower_body and lower_match:
                    filters.lower_body = found_colors[-1] if len(found_colors) > 1 else found_colors[0]
                
                if not filters.upper_body and not filters.lower_body:
                    filters.color = found_colors[0]

        else:
            words = set(re.findall(r"\w+", query))
            
            for canonical, synonyms in cls.COLOR_SYNONYMS.items():
                if any(word in words for word in synonyms):
                    filters.color = canonical
                    break

            for canonical, synonyms in cls.OBJECT_SYNONYMS.items():
                if any(word in words for word in synonyms):
                    filters.detected_type = canonical
                    break

            for category in cls.CATEGORIES:
                if category in words:
                    filters.category = category
                    break

            for vehicle in cls.VEHICLE_TYPES:
                if vehicle in words:
                    filters.vehicle_type = vehicle
                    break

            if {"shirt", "tshirt", "jacket", "top", "saree"} & words:
                for color in cls.BODY_COLORS:
                    if color in words:
                        filters.upper_body = color
                        break

            if {"pant", "pants", "jeans", "trouser", "trousers", "skirt"} & words:
                for color in cls.BODY_COLORS:
                    if color in words:
                        filters.lower_body = color
                        break

            for zone in cls.ZONES:
                if zone in words:
                    filters.zone = zone
                    break

            for event in cls.EVENTS:
                if event in words:
                    filters.event = event
                    break

            plate_match = re.search(r"\b(?=[A-Za-z]*[0-9])(?=[0-9]*[A-Za-z])[A-Za-z0-9\-]{5,15}\b", query.upper())
            if plate_match:
                filters.vehicle_number = plate_match.group()

        cleaned = " ".join(query.split())
        expanded = cleaned
        for key, values in cls.QUERY_EXPANSIONS.items():
            if key in cleaned:
                expanded += " " + " ".join(values)
        expanded = " ".join(expanded.split())

        return expanded, filters