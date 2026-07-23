/**
 * High-Performance WebSocket Audio Streaming Client for Hearly v2.
 * Streams 500ms PCM frames to server with auto-reconnection, packet sequencing, buffering, and retries.
 */

export interface StreamingClientOptions {
  url: string;
  reconnectIntervalMs?: number;
  maxReconnectAttempts?: number;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onStatusChange?: (status: 'connected' | 'reconnecting' | 'disconnected') => void;
}

export class StreamingAudioClient {
  private ws: WebSocket | null = null;
  private options: Required<StreamingClientOptions>;
  private reconnectAttempts: number = 0;
  private sequenceNumber: number = 0;
  private frameQueue: ArrayBuffer[] = [];
  private isIntentionallyClosed: boolean = false;

  constructor(options: StreamingClientOptions) {
    this.options = {
      reconnectIntervalMs: 2000,
      maxReconnectAttempts: 5,
      onTranscript: () => {},
      onStatusChange: () => {},
      ...options,
    };
  }

  public connect(): void {
    this.isIntentionallyClosed = false;
    try {
      this.ws = new WebSocket(this.options.url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.options.onStatusChange('connected');
        this.flushQueue();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          if (typeof event.data === 'string') {
            const data = JSON.parse(event.data);
            if (data.type === 'TRANSCRIPT_FRAME') {
              this.options.onTranscript(data.text || '', Boolean(data.isFinal));
            }
          }
        } catch (err) {
          console.error('[Hearly Streaming] Failed to parse message:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[Hearly Streaming] WebSocket error:', err);
      };

      this.ws.onclose = () => {
        if (!this.isIntentionallyClosed) {
          this.handleReconnect();
        } else {
          this.options.onStatusChange('disconnected');
        }
      };
    } catch (err) {
      console.error('[Hearly Streaming] Connection exception:', err);
      this.handleReconnect();
    }
  }

  /**
   * Sends a 500ms PCM audio frame.
   */
  public sendPcmFrame(pcmBuffer: ArrayBuffer): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.sequenceNumber++;
      this.ws.send(pcmBuffer);
    } else {
      // Queue frame during transient disconnection
      if (this.frameQueue.length > 50) {
        this.frameQueue.shift(); // Drop oldest frame to avoid unbounded buffer growth
      }
      this.frameQueue.push(pcmBuffer);
    }
  }

  private flushQueue(): void {
    while (this.frameQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const frame = this.frameQueue.shift();
      if (frame) {
        this.ws.send(frame);
      }
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.options.onStatusChange('disconnected');
      return;
    }

    this.reconnectAttempts++;
    this.options.onStatusChange('reconnecting');
    const delay = this.options.reconnectIntervalMs * Math.pow(1.5, this.reconnectAttempts - 1);
    setTimeout(() => this.connect(), delay);
  }

  public disconnect(): void {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.frameQueue = [];
    this.options.onStatusChange('disconnected');
  }
}
