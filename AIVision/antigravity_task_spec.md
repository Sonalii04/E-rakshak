# AIVision Pipeline — Prioritized Fix Task Spec

Source of findings: `pipeline_documentation.md` review + statistical audit of a real
`metadata.csv` export (578 tracks, camera `central_bus_depot_entry_gate`).

Ordering rule: fix things that are **actively producing wrong data today** before
things that are **missing features**. Each task below is scoped for an agentic
coding session — includes the evidence, the target files, and a concrete
acceptance check so the agent (or you) can verify the fix actually worked
against a re-run of the same video, not just "looks plausible."

---

## P0 — Actively wrong data (fix before anything else)

### P0.1 — VLM hallucination guardrail (`src/attributes/vlm_captioner.py`)
**Evidence:** On sampled person tracks, `vlm_description` describes scenes/attributes
that contradict or bear no relation to the structured heuristic attributes on the
same row (e.g., a bus-depot gate track captioned as "a person standing on a beach...
holding a red bag... resting on the handlebars of a bicycle"). Two separate vehicle
tracks receive two different, plausible-looking license plates in free text
(`GJ05D0873`, `C19Z1022`) while the structured `vehicle_number` field — the one meant
to hold this — is empty for both (populated in only 2 of 578 rows overall).
Recurring boilerplate phrases ("state of distress," "black and white photograph,"
"late twenties or early thirties," "bald") appear verbatim across unrelated tracks,
consistent with Florence-2-base falling back to generic captions on crops it can't
actually ground.

**Tasks:**
1. Add a minimum resolution/sharpness gate before a crop is sent to the VLM
   (reuse `KeyframeSelector`'s existing sharpness/brightness scores). Below
   threshold → skip VLM captioning, mark `vlm_description: null`, do not force
   an answer.
2. Never let free-text VLM output write into structured fields (`vehicle_number`,
   `color`, etc.). OCR-style claims (plate numbers) must come from a real OCR
   step or stay empty.
3. Add a post-hoc consistency check: extract color/clothing terms mentioned in
   `vlm_description` and diff against `color`/`upper_body`/`lower_body`. On
   disagreement, either drop the VLM sentence or tag the row
   (`vlm_consistency_flag: true`) instead of shipping both silently.
4. Evaluate swapping `microsoft/Florence-2-base` → `Florence-2-large` (or another
   VQA-capable model) on a held-out set of the worst-offending crops from this
   audit; base model is the likely root cause on small/blurry CCTV crops.

**Acceptance check:** Re-run the same source video. Sample 20 person/vehicle
tracks; `vlm_description` content must not contradict structured attributes on
the same row, and no invented plate numbers should appear unless
`vehicle_number` is also populated from a verified source.

---

### P0.2 — Color classifier replacement (`src/attributes/color_utils.py`)
**Evidence:** Across 578 tracks, 84% of `color` values are `unknown` or a
grayscale-family value (`gray` 24%, `dark gray` 10%, `charcoal` 6%, `silver` 3%,
`light gray` 2%, `unknown` 39%). Only 4.3% of tracks get a genuine chromatic
color. The CLAHE/masking/white-preservation patches already in place have not
moved this number meaningfully — this is a structural limitation of
KMeans+CIEDE2000-against-templates, not a tunable parameter.

**Tasks:**
1. Implement CLIP zero-shot color classification (already planned) as the
   primary path: embed the masked crop, compare against a prompt set of color
   names via cosine similarity, replacing KMeans-cluster-to-template matching.
2. Keep the existing KMeans approach only as a fallback/tiebreaker signal, not
   primary classifier.
3. Re-run the same 578-track dataset and recompute the color distribution table
   above as a regression check.

**Acceptance check:** Chromatic (non-gray, non-unknown) color rate should rise
well above the current 4.3% baseline on the same source video without a
corresponding rise in wrong colors (spot-check 30 crops manually).

---

## P1 — Confidence/threshold tuning (classifier exists, is over-rejecting)

### P1.1 — Vehicle sub-type confidence threshold (`src/metadata/metadata_validator.py`)
**Evidence:** The auto-rickshaw/e-rickshaw refinement of YOLO's generic
`car`/`motorcycle` classes is already working (5 and 4 correctly refined
instances found) — this is *not* the "absent from COCO" blocker originally
assumed. The real issue: 56% of `car`-class tracks and 60% of `truck`-class
tracks are rejected down to `detected_type: unknown`.

**Tasks:**
1. Log the raw confidence scores (pre-rejection) for the `unknown`-mapped
   tracks in this dataset to determine whether they're clustered just below
   threshold (→ tune threshold) or genuinely low-confidence (→ classifier
   needs more training signal, not a threshold change).
2. If threshold-bound: adjust per-class thresholds in config rather than a
   single global cutoff, since car/truck reject rates are much higher than
   bus (18%) or motorcycle (25%).

**Acceptance check:** `unknown` rate for `car`/`truck` `detected_type` drops
materially on a re-run without an increase in wrong-but-confident
classifications (spot-check a sample of newly-classified rows).

---

## P2 — Missing feature (net-new, lower urgency than P0/P1 since nothing is wrong yet, just absent)

### P2.1 — Gender classification for person tracks
Per the original plan: pretrained PETA/RAP/PA-100k-style attribute model with
`"unknown"` fallback, OR prototype via VLM prompt on low-confidence tracks only
(cheaper to stand up, piggybacks on the P0.1 guardrail work so it inherits the
same reliability fixes). Recommend prototyping the VLM route first given P0.1
is already touching this code path, only building a dedicated model if VLM
accuracy/latency doesn't hold up at scale.

---

## P3 — Schema / format cleanup (non-urgent, but will bite downstream consumers)

Found during CSV audit, not yet causing wrong *analytics* but will cause
integration bugs:

1. **Zone capitalization inconsistent**: `"Entrance Gate"`, `"Parking Area"`,
   `"Main Road"` are Title Case; `"outside"` is lowercase. Normalize one
   convention across `src/spatial/zone_analyzer.py` and config-defined zones.
2. **Undocumented event value**: `wrong_direction` appears in real output (9
   occurrences) but isn't listed in `pipeline_documentation.md`'s event
   vocabulary. Update docs or confirm it's intentional and add to the
   documented enum.
3. **`vehicle_number` field is effectively unused**: populated in 2 of 190
   vehicle rows (1%). Either wire up real OCR-based plate reading or remove
   the field until it's functional — its near-total emptiness currently gives
   a false impression of capability, especially next to VLM-fabricated plates
   in free text (see P0.1).
4. **Add `schema_version` field** to JSON/CSV export so downstream consumers
   don't silently break as fields like `gender` (P2.1) get added.
5. **Track duration outliers**: two person tracks at 129.6s and 72.0s vs a
   578-track median of 4.65s. Check whether these are genuine loitering
   events or ByteTrack ID persistence across an occlusion it shouldn't have
   survived (track-fusion bug) — verify against the source video before
   assuming either.

---

## Suggested execution order for the agent
`P0.1 → P0.2 → P1.1 → P2.1 → P3 (can be done in parallel with any of the above,
lowest risk of breaking anything else)`
