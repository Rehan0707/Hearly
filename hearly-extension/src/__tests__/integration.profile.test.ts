import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the encrypted storage module using globals (avoid hoisting issues)
vi.mock('@/services/cryptoStorage', () => ({
  EncryptedLocalStorage: {
    encryptAndSet: async (_key: string, _data: unknown) => {
      (globalThis as any).__mock_encrypt_called = true;
      return Promise.resolve();
    },
    decryptAndGet: async (_key: string) => {
      return Promise.resolve((globalThis as any).__mock_decrypt_value ?? null);
    },
  },
}));

import { saveVoiceProfile, loadVoiceProfile } from '@/services/storageService';
import { STORAGE_KEYS } from '@/config/constants';

// Minimal chrome.storage mock
const chromeMock = {
  storage: {
    local: {
      set: vi.fn((_obj: any, cb?: () => void) => cb && cb()),
      get: vi.fn((_key: any, cb: (res: any) => void) => cb({})),
    },
  },
};

// Provide global chrome for the test environment
beforeEach(() => {
  (globalThis as any).chrome = chromeMock;
  (globalThis as any).__mock_encrypt_called = false;
  (globalThis as any).__mock_decrypt_value = undefined;
  (chromeMock.storage.local.set as any).mockClear();
});

describe('Storage integration', () => {
  it('saves voice profile to encrypted storage and runtime key', async () => {
    const profile = {
      id: 'p1',
      userName: 'Alice',
      embedding: new Float32Array([0.1, 0.2, 0.3]),
      embeddingModel: 'fallback' as const,
      enrolledAt: 12345,
      isActive: true,
    };

    await saveVoiceProfile(profile as any);

    expect((globalThis as any).__mock_encrypt_called).toBe(true);
    expect((chromeMock.storage.local.set as any)).toHaveBeenCalled();

    const setArg = (chromeMock.storage.local.set as any).mock.calls[0][0];
    expect(setArg[STORAGE_KEYS.runtimeProfile]).toBeDefined();
    expect(setArg[STORAGE_KEYS.runtimeProfile].userName).toBe('Alice');
  });

  it('loads voice profile and returns embedding as Float32Array', async () => {
    (globalThis as any).__mock_decrypt_value = {
      id: 'p2',
      userName: 'Bob',
      embedding: [0.4, 0.5, 0.6],
      embeddingModel: 'fallback',
      enrolledAt: 999,
      isActive: true,
    };

    const loaded = await loadVoiceProfile();
    expect(loaded).not.toBeNull();
    expect(loaded?.userName).toBe('Bob');
    expect(loaded?.embedding).toBeInstanceOf(Float32Array);
    const arr = Array.from(loaded!.embedding);
    expect(arr.length).toBe(3);
    expect(arr[0]).toBeCloseTo(0.4, 6);
    expect(arr[1]).toBeCloseTo(0.5, 6);
    expect(arr[2]).toBeCloseTo(0.6, 6);
  });
});
