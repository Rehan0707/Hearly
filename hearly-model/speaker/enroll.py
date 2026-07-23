"""
Incremental Multi-Profile Voice Enrollment Engine.
Manages speaker profiles, averages embedding vectors across enrollment samples, and computes profile metadata.
"""

import json
import torch
import torch.nn.functional as F
from typing import List, Dict, Optional


class VoiceProfileManager:
    """Manages voice profiles, embedding vectors, and incremental enrollment updates."""

    def __init__(self):
        self.profiles: Dict[str, Dict] = {}

    def create_profile(self, profile_id: str, name: str) -> Dict:
        """Initializes a new speaker profile container."""
        profile = {
            "id": profile_id,
            "name": name,
            "embeddings": [],
            "mean_embedding": None,
            "sample_count": 0,
            "quality_score": 0.0,
        }
        self.profiles[profile_id] = profile
        return profile

    def add_enrollment_sample(self, profile_id: str, embedding: torch.Tensor) -> Dict:
        """
        Adds a 192D embedding sample to an existing profile and recalculates normalized mean embedding.
        """
        if profile_id not in self.profiles:
            raise KeyError(f"Profile ID {profile_id} does not exist.")

        if embedding.dim() == 2:
            embedding = embedding.squeeze(0)

        # Normalize sample embedding
        norm_emb = F.normalize(embedding, p=2, dim=0)

        profile = self.profiles[profile_id]
        profile["embeddings"].append(norm_emb)
        profile["sample_count"] += 1

        # Re-compute mean vector & L2 normalize
        stacked = torch.stack(profile["embeddings"], dim=0)
        mean_vector = torch.mean(stacked, dim=0)
        norm_mean = F.normalize(mean_vector, p=2, dim=0)

        profile["mean_embedding"] = norm_mean.tolist()
        profile["quality_score"] = min(1.0, profile["sample_count"] / 5.0)

        return profile

    def export_profile_json(self, profile_id: str) -> str:
        """Exports profile metadata & mean embedding vector as JSON string."""
        if profile_id not in self.profiles:
            raise KeyError(f"Profile ID {profile_id} not found.")

        return json.dumps(self.profiles[profile_id], indent=2)
