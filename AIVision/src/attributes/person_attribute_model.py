"""Pretrained person-attribute model wrapper for gender classification.

Uses a shared CLIP instance to perform zero-shot classification from full-body crops.
"""

import logging
import cv2
import numpy as np

logger = logging.getLogger(__name__)


class PersonAttributeModel:
    def __init__(self, config: dict = None, clip_embedder = None):
        self.config = config or {}
        self.clip = clip_embedder
        
        # Lazily retrieve the shared CLIP model instance if not explicitly provided
        if self.clip is None:
            try:
                from src.embeddings.clip_embedder import get_clip_embedder_instance
                clip_model_name = self.config.get("models", {}).get("clip_model_name", "openai/clip-vit-base-patch32")
                self.clip = get_clip_embedder_instance(clip_model_name)
            except Exception as e:
                logger.warning("Failed to retrieve shared ClipEmbedder for gender classification: %s", e)
                
        # Define prompts for zero-shot classification
        self.female_prompts = [
            "a photo of a woman",
            "a photo of a female pedestrian",
            "a photo of a girl",
            "a photo of a female person"
        ]
        self.male_prompts = [
            "a photo of a man",
            "a photo of a male pedestrian",
            "a photo of a boy",
            "a photo of a male person"
        ]
        self.all_prompts = self.female_prompts + self.male_prompts
        self.text_features = None
        
        if self.clip is not None:
            self._precompute_text_features()

    def _extract_tensor(self, features, projection_fn=None):
        import torch
        if isinstance(features, torch.Tensor):
            return features
        if hasattr(features, "text_embeds") and features.text_embeds is not None:
            return features.text_embeds
        if hasattr(features, "image_embeds") and features.image_embeds is not None:
            return features.image_embeds
        val = None
        if hasattr(features, "pooler_output") and features.pooler_output is not None:
            val = features.pooler_output
        elif hasattr(features, "last_hidden_state") and features.last_hidden_state is not None:
            val = features.last_hidden_state[:, 0, :]
        elif isinstance(features, (list, tuple)) and len(features) > 0:
            val = features[0]
            
        if val is not None and projection_fn is not None:
            try:
                return projection_fn(val)
            except Exception:
                pass
        return val if val is not None else features

    def _precompute_text_features(self):
        import torch
        try:
            inputs = self.clip.processor(text=self.all_prompts, return_tensors="pt", padding=True).to(self.clip.device)
            with torch.no_grad():
                features = self.clip.model.get_text_features(**inputs)
            features = self._extract_tensor(features, getattr(self.clip.model, "text_projection", None))
            # Normalize embeddings
            self.text_features = features / features.norm(p=2, dim=-1, keepdim=True)
            logger.info("Precomputed gender text prompts for zero-shot classification")
        except Exception as e:
            logger.warning("Failed to precompute CLIP text features for gender: %s", e)

    def predict_gender(self, crop_bgr: np.ndarray) -> tuple:
        """Classify gender of a full-body person crop.

        Returns:
            (gender_label, confidence) - e.g. ("male", 0.85) or ("unknown", 0.0)
        """
        if self.clip is None or self.text_features is None:
            return "unknown", 0.0
            
        if crop_bgr is None or crop_bgr.size == 0:
            return "unknown", 0.0
            
        try:
            import torch
            
            # Preprocess image crop
            rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
            inputs = self.clip.processor(images=rgb, return_tensors="pt").to(self.clip.device)
            
            with torch.no_grad():
                image_features = self.clip.model.get_image_features(**inputs)
            image_features = self._extract_tensor(image_features, getattr(self.clip.model, "visual_projection", None))
            # Normalize embedding
            image_features = image_features / image_features.norm(p=2, dim=-1, keepdim=True)
            
            # Compute cosine similarities
            similarities = torch.matmul(image_features, self.text_features.T).squeeze(0)
            
            # Compute softmax probabilities using logit scale from the model
            logit_scale = self.clip.model.logit_scale.exp()
            logits = similarities * logit_scale
            probs = torch.softmax(logits, dim=-1)
            
            # Aggregate probabilities for female prompts vs male prompts
            female_prob = float(probs[:len(self.female_prompts)].sum().item())
            male_prob = float(probs[len(self.female_prompts):].sum().item())
            
            if female_prob > male_prob:
                gender = "female"
                confidence = female_prob
            else:
                gender = "male"
                confidence = male_prob
                
            return gender, round(confidence, 2)
        except Exception as e:
            logger.warning("Error predicting gender via CLIP: %s", e)
            return "unknown", 0.0
