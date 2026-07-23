import { describe, it, expect } from 'vitest';
import { ProfileManager, SpeakerProfile } from '../ai/profileManager';
import { DiarizationEngine } from '../ai/diarization';

describe('ECAPA-TDNN ProfileManager & Diarization', () => {
  it('correctly computes cosine similarity between identical vectors', () => {
    const manager = new ProfileManager();
    const vecA = [0.5, 0.5, 0.5, 0.5];
    const sim = manager.cosineSimilarity(vecA, vecA);
    expect(sim).toBeCloseTo(1.0);
  });

  it('verifies candidate against active speaker profile', () => {
    const mockProfile: SpeakerProfile = {
      id: 'profile_user_1',
      name: 'John Doe',
      embedding: [0.8, 0.1, 0.0, 0.0],
      createdAt: Date.now(),
      sampleCount: 5,
      qualityScore: 1.0,
    };

    const manager = new ProfileManager([mockProfile], 'profile_user_1');
    manager.setThreshold(0.70);

    const matchCandidate = [0.82, 0.09, 0.0, 0.0];
    const nonMatchCandidate = [0.0, 0.9, 0.1, 0.0];

    expect(manager.verifyCandidate(matchCandidate).isMatch).toBe(true);
    expect(manager.verifyCandidate(nonMatchCandidate).isMatch).toBe(false);
  });

  it('diarizes enrolled user vs unknown speaker clusters correctly', () => {
    const mockProfile: SpeakerProfile = {
      id: 'profile_user_1',
      name: 'Alice',
      embedding: [0.9, 0.1, 0.0],
      createdAt: Date.now(),
      sampleCount: 5,
      qualityScore: 1.0,
    };
    const manager = new ProfileManager([mockProfile], 'profile_user_1');
    const diarizer = new DiarizationEngine(manager);

    const meTag = diarizer.identifySpeaker([0.91, 0.08, 0.0]);
    expect(meTag.isEnrolledUser).toBe(true);
    expect(meTag.label).toContain('Alice (Me)');

    const unknownTag = diarizer.identifySpeaker([0.0, 0.95, 0.05]);
    expect(unknownTag.isEnrolledUser).toBe(false);
    expect(unknownTag.label).toContain('Speaker A');
  });
});
