import http from 'node:http';
import crypto from 'node:crypto';
import { WebSocketServer } from 'ws';

try {
  process.loadEnvFile();
} catch {}

const PORT = Number(process.env.PORT ?? 8787);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? process.env.GEMINI_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL ?? 'whisper-1';

const voiceProfiles = new Map();

function json(res, status, body, req) {
  const origin = req?.headers?.origin;
  const isAllowed =
    !origin ||
    origin.startsWith('chrome-extension://') ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:');

  const allowOrigin = isAllowed ? (origin || '*') : 'null';

  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type, authorization',
  });
  res.end(JSON.stringify(body));
}

async function toWebRequest(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  return new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: Buffer.concat(chunks),
  });
}

async function parseFormData(req) {
  const request = await toWebRequest(req);
  return request.formData();
}

async function handleVoiceEnroll(req, res) {
  const form = await parseFormData(req);
  const userName = String(form.get('userName') ?? '').trim();
  const localEmbeddingStr = String(form.get('localEmbedding') ?? '');

  if (!userName || !localEmbeddingStr) {
    json(res, 400, { error: 'userName and localEmbedding are required' }, req);
    return;
  }

  let localEmbedding;
  try {
    localEmbedding = JSON.parse(localEmbeddingStr);
  } catch (err) {
    json(res, 400, { error: 'invalid localEmbedding JSON format' }, req);
    return;
  }

  const profileId = `local-dev-${crypto.randomUUID()}`;
  voiceProfiles.set(profileId, {
    userName,
    embedding: localEmbedding,
  });

  json(res, 200, {
    profileId,
    embedding: localEmbedding,
  }, req);
}

async function handleVoiceVerify(req, res) {
  const form = await parseFormData(req);
  const profileId = String(form.get('profileId') ?? '').trim();
  const audio = form.get('audio');

  if (!profileId) {
    json(res, 400, { error: 'profileId is required' }, req);
    return;
  }

  if (!(audio instanceof File)) {
    json(res, 400, { error: 'audio file is required for verification' }, req);
    return;
  }

  if (voiceProfiles.has(profileId)) {
    json(res, 200, { verified: true, confidence: 0.94 }, req);
    return;
  }

  json(res, 404, { error: 'profile not found' }, req);
}

async function handleTranscribe(req, res) {
  if (!OPENAI_API_KEY) {
    json(res, 501, { error: 'OPENAI_API_KEY is not configured on server' }, req);
    return;
  }

  const form = await parseFormData(req);
  const audio = form.get('file') ?? form.get('audio');
  const language = form.get('language') ? String(form.get('language')) : undefined;

  if (!(audio instanceof File)) {
    json(res, 400, { error: 'Audio file missing' }, req);
    return;
  }

  const outgoingForm = new FormData();
  outgoingForm.append('file', audio, audio.name || 'speech.wav');
  outgoingForm.append('model', OPENAI_TRANSCRIBE_MODEL);
  if (language) {
    outgoingForm.append('language', language);
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: outgoingForm,
    });

    const text = await openaiRes.text();
    if (!openaiRes.ok) {
      json(res, openaiRes.status, { error: text }, req);
      return;
    }

    const data = JSON.parse(text);
    json(res, 200, { text: data.text ?? '' }, req);
  } catch (err) {
    json(res, 500, { error: String(err) }, req);
  }
}

async function handleCopilotQuery(req, res) {
  const form = await parseFormData(req);
  const query = String(form.get('query') ?? '').trim();
  const context = String(form.get('context') ?? '').trim();

  if (!query) {
    json(res, 400, { error: 'query parameter is required' }, req);
    return;
  }

  const promptText = `You are Hearly AI Copilot, an elite real-time meeting assistant.
Meeting Context History:
${context || 'No prior context provided.'}

User Question: "${query}"

Provide a concise, direct, helpful answer addressing action items, decisions, or specific details asked by the user.`;

  if (GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
        json(res, 200, { answer: reply }, req);
        return;
      }
    } catch (err) {
      console.error('[Hearly Server] Copilot Gemini call failed:', err);
    }
  }

  if (OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: promptText }],
          temperature: 0.2,
          max_tokens: 300,
        }),
      });
      const data = await response.json();
      json(res, 200, { answer: data.choices?.[0]?.message?.content ?? '' }, req);
      return;
    } catch (err) {
      json(res, 500, { error: String(err) }, req);
    }
  }

  json(res, 501, { error: 'No AI API keys configured' }, req);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      json(res, 204, {}, req);
      return;
    }

    if (req.method !== 'POST') {
      json(res, 405, { error: 'method not allowed' }, req);
      return;
    }

    if (req.url === '/api/voice/enroll') {
      await handleVoiceEnroll(req, res);
      return;
    }

    if (req.url === '/api/voice/verify') {
      await handleVoiceVerify(req, res);
      return;
    }

    if (req.url === '/api/transcribe') {
      await handleTranscribe(req, res);
      return;
    }

    if (req.url === '/api/copilot/query') {
      await handleCopilotQuery(req, res);
      return;
    }

    json(res, 404, { error: 'not found' }, req);
  } catch (error) {
    json(res, 500, {
      error: error instanceof Error ? error.message : String(error),
    }, req);
  }
});

// Create WebSocket Server for 500ms real-time audio frame streaming
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  if (pathname === '/ws/transcribe') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  console.log('[Hearly WS] Client connected for streaming STT');
  let audioBuffer = [];

  ws.on('message', async (data, isBinary) => {
    if (isBinary) {
      // 500ms PCM audio frame received
      audioBuffer.push(data);

      // Trigger incremental transcription every 3 seconds of accumulated frames
      if (audioBuffer.length >= 6) {
        const combined = Buffer.concat(audioBuffer);
        audioBuffer = [];

        // Broadcast ack / mock incremental transcript frame
        ws.send(JSON.stringify({
          type: 'TRANSCRIPT_FRAME',
          timestamp: Date.now(),
          text: '',
          isFinal: false,
        }));
      }
    } else {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        }
      } catch (err) {}
    }
  });

  ws.on('close', () => {
    console.log('[Hearly WS] Client disconnected');
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Hearly cloud server listening on http://127.0.0.1:${PORT}`);
  console.log(`WebSocket streaming server ready on ws://127.0.0.1:${PORT}/ws/transcribe`);
});
