"""
Cosine Similarity and Dynamic Speaker Verification Thresholding.
Calculates cosine distance/similarity scores between candidate embeddings and enrolled profiles.
"""

import torch
import torch.nn.functional as F
from typing import Union, List, Tuple


def compute_cosine_similarity(
    emb1: Union[torch.Tensor, List[float]],
    emb2: Union[torch.Tensor, List[float]],
) -> float:
    """
    Computes cosine similarity score in range [-1.0, 1.0] between two 192D embeddings.
    """
    if isinstance(emb1, list):
        emb1 = torch.tensor(emb1, dtype=torch.float32)
    if isinstance(emb2, list):
        emb2 = torch.tensor(emb2, dtype=torch.float32)

    if emb1.dim() == 1:
        emb1 = emb1.unsqueeze(0)
    if emb2.dim() == 1:
        emb2 = emb2.unsqueeze(0)

    sim = F.cosine_similarity(emb1, emb2, dim=1)
    return float(sim.item())


def verify_speaker(
    candidate_embedding: Union[torch.Tensor, List[float]],
    enrolled_embedding: Union[torch.Tensor, List[float]],
    threshold: float = 0.72,
) -> Tuple[bool, float]:
    """
    Verifies if a candidate embedding matches the enrolled speaker embedding above threshold.
    Returns: (is_match: bool, similarity_score: float)
    """
    score = compute_cosine_similarity(candidate_embedding, enrolled_embedding)
    is_match = score >= threshold
    return is_match, score
