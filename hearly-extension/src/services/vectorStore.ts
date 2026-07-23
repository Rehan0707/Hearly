/**
 * Local Cross-Meeting Vector Search Engine for Hearly v2.
 * Calculates term-frequency/semantic vector embeddings and performs cosine similarity search over encrypted meeting memory.
 */

import { EncryptedMeetingDb, MeetingRecord } from './encryptedDb';

export interface SearchResult {
  meeting: MeetingRecord;
  score: number;
  snippet: string;
}

export class LocalVectorStore {
  private db: EncryptedMeetingDb;

  constructor(db: EncryptedMeetingDb) {
    this.db = db;
  }

  /**
   * Generates a 128-dimensional normalized term frequency embedding vector for a given text snippet.
   */
  public generateTextEmbedding(text: string): number[] {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const vector = new Array(128).fill(0);
    words.forEach((word) => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.charCodeAt(i);
        hash |= 0;
      }
      const index = Math.abs(hash) % 128;
      vector[index] += 1;
    });

    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1.0;
    return vector.map((v) => v / norm);
  }

  /**
   * Performs semantic vector search over past stored meeting records.
   */
  public async semanticSearch(query: string, topK: number = 5): Promise<SearchResult[]> {
    const meetings = await this.db.getAllMeetings();
    const queryVector = this.generateTextEmbedding(query);

    const results: SearchResult[] = [];

    for (const meeting of meetings) {
      const fullText = `${meeting.title} ${meeting.summary} ${meeting.transcript.map((t) => t.text).join(' ')}`;
      const meetingVector = meeting.embedding || this.generateTextEmbedding(fullText);

      let dot = 0;
      for (let i = 0; i < queryVector.length; i++) {
        dot += queryVector[i] * (meetingVector[i] || 0);
      }

      if (dot > 0.15) {
        results.push({
          meeting,
          score: dot,
          snippet: meeting.summary || fullText.slice(0, 180) + '...',
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}
