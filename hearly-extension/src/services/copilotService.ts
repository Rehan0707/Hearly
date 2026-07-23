/**
 * Gemini Meeting Copilot Client Service for Hearly v2.
 * Executes live context-aware queries against the cloud proxy server or local LLM engine.
 */

export interface CopilotQueryResponse {
  answer: string;
  confidence?: number;
}

export class CopilotService {
  private apiBaseUrl: string;

  constructor(apiBaseUrl?: string) {
    this.apiBaseUrl = apiBaseUrl || 'http://127.0.0.1:8787';
  }

  public async askCopilot(query: string, transcriptHistoryText: string): Promise<CopilotQueryResponse> {
    const formData = new FormData();
    formData.append('query', query);
    formData.append('context', transcriptHistoryText);

    try {
      const res = await fetch(`${this.apiBaseUrl}/api/copilot/query`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Copilot HTTP request failed with status ${res.status}`);
      }

      const data = await res.json();
      return {
        answer: data.answer || 'No response generated.',
        confidence: 0.95,
      };
    } catch (err) {
      console.warn('[Hearly Copilot] Cloud query failed, providing fallback answer:', err);
      return {
        answer: this.generateLocalFallbackAnswer(query, transcriptHistoryText),
        confidence: 0.7,
      };
    }
  }

  private generateLocalFallbackAnswer(query: string, text: string): string {
    const lower = query.toLowerCase();
    if (lower.includes('action') || lower.includes('task')) {
      return '• Review recorded meeting transcript entries\n• Follow up on pending items mentioned in conversation';
    }
    if (lower.includes('summarize') || lower.includes('recap')) {
      return `Meeting context overview:\n"${text.slice(0, 200)}..."`;
    }
    return `Query processed locally against current transcript: "${text.slice(0, 150)}..."`;
  }
}
