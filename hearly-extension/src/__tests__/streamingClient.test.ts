import { describe, it, expect } from 'vitest';
import { StreamingAudioClient } from '../audio/streamingClient';

describe('StreamingAudioClient', () => {
  it('instantiates client with default configuration', () => {
    const client = new StreamingAudioClient({
      url: 'ws://127.0.0.1:8787/ws/transcribe',
    });
    expect(client).toBeDefined();
  });

  it('queues PCM frames when WebSocket is disconnected', () => {
    const client = new StreamingAudioClient({
      url: 'ws://127.0.0.1:8787/ws/transcribe',
    });

    const dummyFrame = new Float32Array(1600).buffer;
    expect(() => client.sendPcmFrame(dummyFrame)).not.toThrow();
  });
});
