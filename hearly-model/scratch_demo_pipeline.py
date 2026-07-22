import os
import json
import wave
import torch
import torchaudio
from pathlib import Path
import subprocess

ROOT_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = ROOT_DIR / "hearly-model"
DATA_DIR = MODEL_DIR / "data" / "synth"
MANIFEST_PATH = MODEL_DIR / "data" / "synth_manifest.jsonl"
RUNS_DIR = MODEL_DIR / "runs" / "speaker-v1"
EXPORT_PATH = ROOT_DIR / "hearly-extension" / "public" / "models" / "hearly-speaker-v1.onnx"
PYTHON_BIN = MODEL_DIR / ".venv" / "bin" / "python"

def create_synthetic_dataset():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    sample_rate = 16000
    duration = 3.0
    num_samples = int(sample_rate * duration)
    t = torch.linspace(0, duration, num_samples)
    
    speakers = {
        "user_rehan": [220.0, 440.0, 880.0],
        "speaker_alice": [300.0, 600.0, 1200.0],
        "speaker_bob": [150.0, 300.0, 600.0]
    }
    
    manifest_lines = []
    
    print("Generating synthetic WAV audio clips...")
    for speaker_id, freqs in speakers.items():
        for i in range(5):
            # Mix harmonics with slight random noise
            waveform = torch.zeros(1, num_samples)
            for f in freqs:
                phase = torch.rand(1).item() * 6.28
                waveform += 0.3 * torch.sin(2 * 3.14159 * f * t + phase)
            
            # Add small random noise
            waveform += 0.05 * torch.randn(1, num_samples)
            # Normalize
            waveform = waveform / torch.max(torch.abs(waveform))
            
            # Convert float tensor to 16-bit PCM bytes
            audio_samples = (waveform.squeeze(0) * 32767.0).clamp(-32768, 32767).short().numpy()
            
            clip_name = f"{speaker_id}_clip_{i:02d}.wav"
            clip_path = DATA_DIR / clip_name
            
            with wave.open(str(clip_path), "wb") as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(sample_rate)
                wf.writeframes(audio_samples.tobytes())
            
            manifest_lines.append({
                "path": str(clip_path.relative_to(DATA_DIR.parent)),
                "speaker_id": speaker_id
            })
            
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        for line in manifest_lines:
            f.write(json.dumps(line) + "\n")
            
    print(f"Dataset created with {len(manifest_lines)} clips. Manifest: {MANIFEST_PATH}")

def run_cmd(cmd):
    env = os.environ.copy()
    env["PYTHONPATH"] = str(MODEL_DIR / "src")
    print("\nRunning command:", " ".join(cmd))
    res = subprocess.run(cmd, env=env, cwd=ROOT_DIR, capture_output=True, text=True)
    print("STDOUT:", res.stdout)
    if res.stderr:
        print("STDERR:", res.stderr)
    if res.returncode != 0:
        raise RuntimeError(f"Command failed with code {res.returncode}")

def main():
    print("=== 1. Generating Synthetic Speaker Audio Clips ===")
    create_synthetic_dataset()
    
    print("\n=== 2. Training PyTorch Speaker Model ===")
    run_cmd([
        str(PYTHON_BIN), "-m", "hearly_model.train",
        "--manifest", str(MANIFEST_PATH),
        "--output-dir", str(RUNS_DIR),
        "--epochs", "10",
        "--batch-size", "4"
    ])
    
    print("\n=== 3. Evaluating Trained Checkpoint ===")
    run_cmd([
        str(PYTHON_BIN), "-m", "hearly_model.evaluate",
        "--manifest", str(MANIFEST_PATH),
        "--checkpoint", str(RUNS_DIR / "best.pt")
    ])
    
    print("\n=== 4. Exporting ONNX Weights to Chrome Extension ===")
    run_cmd([
        str(PYTHON_BIN), "-m", "hearly_model.export_onnx",
        "--checkpoint", str(RUNS_DIR / "best.pt"),
        "--output", str(EXPORT_PATH)
    ])
    
    print("\n✅ Training & ONNX Export Pipeline Completed Successfully!")

if __name__ == "__main__":
    main()
