"""Open-ended vision-language captioning for track keyframes.

The heuristic extractors in `deep_attribute_extractor.py` can only ever report what
they were explicitly coded to look for (garment type, cap/helmet/bag, vehicle body
type, dominant color, ...). This module runs a small vision-language model once per
track, on its single best keyframe, to produce a free-text description that isn't
bounded by that fixed attribute schema -- it can mention anything actually visible
(logos, poses, objects being carried, background context, etc.).

Uses Microsoft's Florence-2-base (~0.23B params) since it is small enough to run at
reasonable speed on CPU-only hardware while still producing genuinely detailed
captions, unlike heavier 7B-class VLMs.
"""

import logging

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


class VLMCaptioner:
    def __init__(self, model_name: str = "microsoft/Florence-2-base", device: str = None,
                 task_prompt: str = "<MORE_DETAILED_CAPTION>",
                 max_new_tokens: int = 150, num_beams: int = 2):
        import torch
        from transformers import AutoModelForCausalLM, AutoProcessor

        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.task_prompt = task_prompt
        self.max_new_tokens = max_new_tokens
        self.num_beams = num_beams
        self.model = AutoModelForCausalLM.from_pretrained(
            model_name, trust_remote_code=True, attn_implementation="eager"
        ).to(self.device).eval()
        self.processor = AutoProcessor.from_pretrained(model_name, trust_remote_code=True)

        # Florence-2's own attention layers still implement the pre-Cache-object
        # legacy protocol (they cat/return plain (key, value) tuples themselves --
        # see modeling_florence2.py), but current `transformers` defaults to wrapping
        # `past_key_values` in an `EncoderDecoderCache` object that this custom code
        # never actually writes into, so real caching silently no-ops (get_seq_length()
        # stays 0 forever) and `prepare_inputs_for_generation` crashes indexing it.
        # Telling `transformers` this model "doesn't support" the modern Cache object
        # makes it fall back to passing plain None/tuples instead, which Florence-2's
        # layers handle correctly -- restoring real, working KV caching without
        # touching the model's own code. Verified same output text either way.
        self._cache_patch_applied = False
        try:
            language_model_cls = type(self.model.language_model)
            language_model_cls._supports_default_dynamic_cache = classmethod(lambda cls: False)
            self._cache_patch_applied = True
        except Exception as e:
            logger.warning("Could not patch Florence-2 for real KV caching, falling back to use_cache=False: %s", e)

    def describe(self, crop_bgr: np.ndarray) -> str:
        """Return a free-text description of a BGR crop, or None on failure/empty crop."""
        if crop_bgr is None or crop_bgr.size == 0:
            return None
        try:
            import torch

            rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(rgb)
            inputs = self.processor(text=self.task_prompt, images=image, return_tensors="pt").to(self.device)

            with torch.no_grad():
                generated_ids = self.model.generate(
                    input_ids=inputs["input_ids"],
                    pixel_values=inputs["pixel_values"],
                    max_new_tokens=self.max_new_tokens,
                    num_beams=self.num_beams,
                    do_sample=False,
                    use_cache=self._cache_patch_applied,
                )

            generated_text = self.processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
            parsed = self.processor.post_process_generation(
                generated_text, task=self.task_prompt, image_size=(image.width, image.height)
            )
            caption = parsed.get(self.task_prompt, "")
            return caption.strip() or None
        except Exception as e:
            logger.warning("VLM captioning failed: %s", e)
            return None
