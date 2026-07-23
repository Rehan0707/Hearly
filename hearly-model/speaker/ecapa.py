"""
ECAPA-TDNN PyTorch Model Implementation for Hearly v2 Speaker Verification.
Emphasized Channel Attention, Propagation and Aggregation in TDNN.
Produces high-discriminative 192-dimensional speaker embeddings.
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F


class SEBlock(nn.Module):
    """Squeeze-and-Excitation Block with 1D Convolution."""

    def __init__(self, channels: int, bottleneck: int = 128):
        super().__init__()
        self.se = nn.Sequential(
            nn.AdaptiveAvgPool1d(1),
            nn.Conv1d(channels, bottleneck, kernel_size=1, padding=0),
            nn.ReLU(inplace=True),
            nn.Conv1d(bottleneck, channels, kernel_size=1, padding=0),
            nn.Sigmoid(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x * self.se(x)


class SERes2NetBlock(nn.Module):
    """Squeeze-and-Excitation Res2Net Block for multi-scale feature extraction."""

    def __init__(
        self,
        channels: int,
        kernel_size: int = 3,
        dilation: int = 1,
        scale: int = 8,
    ):
        super().__init__()
        self.scale = scale
        self.width = channels // scale
        self.conv1 = nn.Conv1d(channels, self.width * scale, kernel_size=1)
        self.bn1 = nn.BatchNorm1d(self.width * scale)

        self.nums = scale - 1
        convs = []
        bns = []
        padding = (kernel_size - 1) * dilation // 2
        for i in range(self.nums):
            convs.append(
                nn.Conv1d(
                    self.width,
                    self.width,
                    kernel_size=kernel_size,
                    dilation=dilation,
                    padding=padding,
                )
            )
            bns.append(nn.BatchNorm1d(self.width))
        self.convs = nn.ModuleList(convs)
        self.bns = nn.ModuleList(bns)

        self.conv3 = nn.Conv1d(self.width * scale, channels, kernel_size=1)
        self.bn3 = nn.BatchNorm1d(channels)
        self.relu = nn.ReLU(inplace=True)
        self.se = SEBlock(channels)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        residual = x
        out = self.relu(self.bn1(self.conv1(x)))
        spx = torch.split(out, self.width, 1)

        sp = spx[0]
        out_features = [sp]
        for i in range(self.nums):
            if i == 0:
                sp = spx[i + 1]
            else:
                sp = sp + spx[i + 1]
            sp = self.relu(self.bns[i](self.convs[i](sp)))
            out_features.append(sp)

        out = torch.cat(out_features, 1)
        out = self.bn3(self.conv3(out))
        out = self.se(out)
        out += residual
        return self.relu(out)


class AttentiveStatsPooling(nn.Module):
    """Attentive Statistics Pooling for ECAPA-TDNN."""

    def __init__(self, in_channels: int, bottleneck_dim: int = 128):
        super().__init__()
        self.conv = nn.Conv1d(in_channels, bottleneck_dim, kernel_size=1)
        self.tanh = nn.Tanh()
        self.attn = nn.Conv1d(bottleneck_dim, in_channels, kernel_size=1)
        self.softmax = nn.Softmax(dim=2)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (Batch, Channels, Time)
        alpha = self.softmax(self.attn(self.tanh(self.conv(x))))
        mean = torch.sum(alpha * x, dim=2)
        residuals = torch.sum(alpha * (x**2), dim=2) - mean**2
        std = torch.sqrt(torch.clamp(residuals, min=1e-9))
        pooled = torch.cat([mean, std], dim=1)
        return pooled


class ECAPA_TDNN(nn.Module):
    """
    ECAPA-TDNN Architecture for Speaker Verification.
    Input: Mel-filterbanks of shape (Batch, Fbank_Bins, Time_Frames)
    Output: Normalized 192D Speaker Embedding (Batch, 192)
    """

    def __init__(
        self,
        input_size: int = 80,
        channels: int = 512,
        embedding_dim: int = 192,
    ):
        super().__init__()
        self.conv1 = nn.Conv1d(input_size, channels, kernel_size=5, padding=2)
        self.bn1 = nn.BatchNorm1d(channels)
        self.relu = nn.ReLU(inplace=True)

        self.layer1 = SERes2NetBlock(channels, kernel_size=3, dilation=2)
        self.layer2 = SERes2NetBlock(channels, kernel_size=3, dilation=3)
        self.layer3 = SERes2NetBlock(channels, kernel_size=3, dilation=4)

        self.mfa = nn.Conv1d(channels * 3, channels * 3, kernel_size=1)
        self.asp = AttentiveStatsPooling(channels * 3, bottleneck_dim=128)
        self.asp_bn = nn.BatchNorm1d(channels * 6)

        self.fc = nn.Linear(channels * 6, embedding_dim)
        self.bn_out = nn.BatchNorm1d(embedding_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.
        :param x: Mel-spectrogram / Filterbanks tensor (B, C_in, T)
        :return: L2-normalized 192D embedding tensor (B, 192)
        """
        x = self.relu(self.bn1(self.conv1(x)))
        out1 = self.layer1(x)
        out2 = self.layer2(out1)
        out3 = self.layer3(out2)

        mfa = torch.cat([out1, out2, out3], dim=1)
        mfa_out = self.relu(self.mfa(mfa))

        pooled = self.asp(mfa_out)
        pooled = self.asp_bn(pooled)

        embedding = self.fc(pooled)
        embedding = self.bn_out(embedding)

        # L2 Normalization for Cosine Similarity matching
        normalized_embedding = F.normalize(embedding, p=2, dim=1)
        return normalized_embedding
