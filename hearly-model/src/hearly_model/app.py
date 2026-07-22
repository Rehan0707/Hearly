import os
import tempfile
import torch
import soundfile as sf
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline

app = FastAPI(title="Hearly VibeVoice & STT Service")

# Add CORS Middleware so browser extension can call it directly if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load transcription pipeline with fallbacks
print("Initializing Speech-to-Text Pipeline...")
stt_pipeline = None
model_used = None

try:
    # 1. Try VibeVoice ASR
    model_id = "microsoft/VibeVoice-ASR-HF"
    print(f"Attempting to load {model_id}...")
    device = 0 if torch.cuda.is_available() else (-1 if not torch.backends.mps.is_available() else "mps")
    
    # Map 'mps' to device ID or use device_map
    device_arg = "auto" if device in ("mps", 0) else -1
    
    stt_pipeline = pipeline(
        "automatic-speech-recognition",
        model=model_id,
        device_map=device_arg,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
    )
    model_used = "VibeVoice-ASR-HF"
    print("VibeVoice-ASR-HF loaded successfully!")
except Exception as e:
    print(f"Failed to load VibeVoice-ASR-HF: {e}. Trying fallback Wav2Vec2...")
    try:
        # 2. Try Wav2Vec2 (already downloaded in dev setup)
        fallback_id = "facebook/wav2vec2-base-960h"
        stt_pipeline = pipeline(
            "automatic-speech-recognition",
            model=fallback_id,
            device=0 if torch.cuda.is_available() else -1
        )
        model_used = "Wav2Vec2-Fallback"
        print("Wav2Vec2 fallback loaded successfully!")
    except Exception as fe:
        print(f"Fallback Wav2Vec2 failed to load: {fe}. Running in Mock Mode.")
        model_used = "Mock-Mode"

@app.post("/api/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: str = Form(None)
):
    try:
        # Write uploaded bytes to a temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(await audio.read())
            tmp_path = tmp.name

        try:
            # Read audio file using soundfile
            data, samplerate = sf.read(tmp_path)
            
            # If multi-channel, convert to mono
            if len(data.shape) > 1:
                data = data.mean(axis=1)

            if stt_pipeline is not None and model_used != "Mock-Mode":
                # Resample to 16000Hz if needed (pipeline usually handles this, but let's be safe)
                result = stt_pipeline(tmp_path)
                transcription_text = result.get("text", "")
            else:
                # Mock Mode fallback
                transcription_text = "[Local Mock Transcription] Speech detected and processed."

            return {
                "text": transcription_text,
                "language": language or "en",
                "model": model_used
            }
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")

@app.get("/health")
def health():
    return {"status": "healthy", "model": model_used}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
