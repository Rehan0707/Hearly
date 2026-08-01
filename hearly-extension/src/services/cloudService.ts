export type CloudTranscriptionResult = {
  text: string;
  language?: string;
  speaker?: 'you' | 'others';
};

const API_BASE_URL = import.meta.env.VITE_HEARLY_API_BASE_URL as string | undefined;

export function isCloudConfigured(): boolean {
  return Boolean(API_BASE_URL?.trim());
}

function getApiBaseUrl(): string {
  const base = API_BASE_URL?.trim();
  if (!base) {
    throw new Error('Hearly cloud API is not configured.');
  }
  return base.replace(/\/$/, '');
}

async function assertOk(response: Response): Promise<void> {
  if (response.ok) return;
  const text = await response.text().catch(() => '');
  throw new Error(text || `Hearly cloud request failed with ${response.status}`);
}

export async function transcribeWithGroq(
  audio: Blob,
  apiKey: string,
  language = 'en',
  retries = 2,
): Promise<string | null> {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const formData = new FormData();
      formData.append('file', audio, 'audio.wav');
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('language', language);

      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: formData,
      });
      if (res.ok) {
        const data = (await res.json()) as { text?: string };
        if (data?.text) return data.text;
      }
    } catch {
      // Retry after delay
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
    }
  }
  return null;
}

export async function transcribeAudioInCloud({
  audio,
  language,
}: {
  audio: Blob;
  language?: string;
}): Promise<CloudTranscriptionResult | null> {
  if (!isCloudConfigured()) return null;

  const form = new FormData();
  form.set('audio', audio, 'audio.webm');
  if (language) form.set('language', language);

  const response = await fetch(`${getApiBaseUrl()}/api/transcribe`, {
    method: 'POST',
    body: form,
  });
  await assertOk(response);
  return response.json() as Promise<CloudTranscriptionResult>;
}
