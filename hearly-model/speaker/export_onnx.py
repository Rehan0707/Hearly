"""
ONNX Exporter for ECAPA-TDNN Speaker Verification Model.
Exports PyTorch weights to optimized web-ready ecapa_tdnn.onnx with dynamic temporal dimensions.
"""

import os
import torch
from typing import str
from .ecapa import ECAPA_TDNN


def export_ecapa_to_onnx(
    output_path: str = "ecapa_tdnn.onnx",
    checkpoint_path: str = None,
    input_size: int = 80,
    embedding_dim: int = 192,
) -> str:
    """
    Exports trained ECAPA-TDNN PyTorch model to ONNX with dynamic batch and time dimensions.
    """
    model = ECAPA_TDNN(input_size=input_size, embedding_dim=embedding_dim)
    model.eval()

    if checkpoint_path and os.path.exists(checkpoint_path):
        state_dict = torch.load(checkpoint_path, map_location="cpu")
        model.load_state_dict(state_dict)
        print(f"Loaded weights from {checkpoint_path}")
    else:
        print("Exporting model with default/initialized weights...")

    # Dummy input representing (Batch=1, Fbank_Bins=80, Time_Frames=200)
    dummy_input = torch.randn(1, input_size, 200, dtype=torch.float32)

    dynamic_axes = {
        "input_mels": {0: "batch_size", 2: "time_frames"},
        "speaker_embedding": {0: "batch_size"},
    }

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["input_mels"],
        output_names=["speaker_embedding"],
        dynamic_axes=dynamic_axes,
    )

    print(f"Successfully exported ECAPA-TDNN to {output_path}")
    return output_path


if __name__ == "__main__":
    export_ecapa_to_onnx("ecapa_tdnn.onnx")
