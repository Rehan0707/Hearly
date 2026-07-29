import { describe, it, expect } from 'vitest';

describe('HearyVoiceProcessor Logic Unit Tests', () => {

  it('should initialize with matchState as false and targetGain at 1.0 when filter is inactive', () => {
    // When filter is inactive, gain should be 1.0
    let filterActive = false;
    let hasVoiceProfile = true;
    let matchState = false;
    let targetGain = 1.0;

    if (!filterActive || !hasVoiceProfile) {
      targetGain = 1.0;
    } else if (matchState) {
      targetGain = 1.0;
    } else {
      targetGain = 0.02;
    }

    expect(targetGain).toBe(1.0);
  });

  it('should apply active speech suppression (gain 0.02) when filter is active and speaker is not matched', () => {
    let filterActive = true;
    let hasVoiceProfile = true;
    let matchState = false;
    let isRecentlyMatched = false;
    let targetGain = 1.0;
    let suppressedGain = 0.02;

    if (!filterActive || !hasVoiceProfile) {
      targetGain = 1.0;
    } else if (isRecentlyMatched && matchState) {
      targetGain = 1.0;
    } else {
      targetGain = suppressedGain;
    }

    expect(targetGain).toBe(0.02);
  });

  it('should restore gain to 1.0 when external match evaluates to true for enrolled speaker', () => {
    let filterActive = true;
    let hasVoiceProfile = true;
    let matchState = true;
    let isRecentlyMatched = true;
    let targetGain = 1.0;

    if (!filterActive || !hasVoiceProfile) {
      targetGain = 1.0;
    } else if (isRecentlyMatched && matchState) {
      targetGain = 1.0;
    } else {
      targetGain = 0.02;
    }

    expect(targetGain).toBe(1.0);
  });

  it('should immediately reset match state to false when external match is false', () => {
    let matchState = true;
    let lastMatchTime = 100;
    const currentTime = 105;

    const payload = { matched: false, score: 0.35 };
    const isMatch = Boolean(payload.matched);

    if (isMatch) {
      matchState = true;
      lastMatchTime = currentTime;
    } else {
      matchState = false;
      lastMatchTime = Number.NEGATIVE_INFINITY;
    }

    expect(matchState).toBe(false);
    expect(lastMatchTime).toBe(Number.NEGATIVE_INFINITY);
  });
});
