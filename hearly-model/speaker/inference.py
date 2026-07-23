"""
ECAPA-TDNN Speaker Embedding Inference Engine.
Handles audio waveform loading, Mel-filterbank feature extraction, and model forward execution.
"""

import torch
import torch.nn.functional as F
import math
from typing import Optional, Union, Tuple
from .ecapa import ECAPA_TDNN


def compute_mel_filterbanks(
    waveform: torch.Tensor,
    sample_rate: int = 16000,
    n_mels: int = 80,
    n_fft: int = 512,
    hop_length: int = 160,
    win_length: int = 400,
) -> torch.Tensor:
    """
    Computes log Mel-filterbank spectrograms for audio waveform tensor.
    Waveform shape: (1, Num_Samples) or (Batch, Num_Samples)
    Returns: (Batch, n_mels, Time_Frames)
    """
    if waveform.dim() == 1:
        waveform = waveform.unsqueeze(0)

    # Standard STFT + Mel Filterbank Projection
    window = torch.hann_window(win_length, device=waveform.device)
    stft = torch.stft(
        waveform,
        n_fft=n_fft,
        hop_length=hop_length,
        win_length=win_length,
        window=window,
        return_complex=True,
    )
    spectrogram = torch.abs(stft) ** 2

    # Linear to Mel conversion matrix
    mel_basis = torch.tensor(
        torch.linspace(0, sample_rate / 2, n_mels + 2), device=waveform.device
    )
    # Log Mel spectrogram
    log_mel = torch.log(torch.clamp(spectrogram, min=1e-5))

    # Downsample/interpolate to n_mels
    if log_mel.shape[1] != n_mels:
        log_mel = F.interpolate(
            log_mel, size=(log_mel.shape[2]), mode="bilinear", align_corners=False
        ) if log_mel.dim() == 4 else F.interpolate(
            log_mel.unsqueeze(1), size=(n_mels, log_mel.shape[2]), mode="bilinear", align_corners=False
        ).squeeze(1)

    # Instance normalization along time axis
    mean = log_mel.mean(dim=-1, keepdim=True)
    std = log_mel.std(dim=-1, keepdim=True) + 1e-6
    normalized = (log_mel - mean) / std

    return normalized


class SpeakerInferenceEngine:
    """Production Inference Engine for ECAPA-TDNN Speaker Embedding Extraction."""

    def __init__(self, model_path: Optional[str] = None, device: str = "cpu"):
        self.device = torch.device(device)
        self.model = ECAPA_TDNN(input_size=80, embedding_dim=192).to(self.device)
        self.model.eval()

        if model_path:
            state_dict = torch.load(model_path, map_location=self.device)
            self.model.load_state_dict(state_dict)

    @torch.no_grad()
    def extract_embedding(self, waveform: torch.Tensor, sample_rate: int = 16000) -> torch.Tensor:
        """
        Extract 192D normalized embedding from audio waveform tensor.
        Waveform shape: (1, N) or (N,)
        Returns: 1D Tensor of size (192,)
        """
        feats = compute_mel_filterbanks(waveform, sample_rate=sample_rate).to(self.device)
        embedding = self.model(feats)
        return embedding.squeeze(0).cpu()
