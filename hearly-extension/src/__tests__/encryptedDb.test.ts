import { describe, it, expect } from 'vitest';
import { LocalVectorStore } from '../services/vectorStore';

describe('LocalVectorStore', () => {
  it('generates normalized 128D term frequency embeddings', () => {
    const mockDb = {} as any;
    const store = new LocalVectorStore(mockDb);

    const vec = store.generateTextEmbedding('Project Apollo launch schedule and milestones');
    expect(vec.length).toBe(128);

    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 3);
  });
});
