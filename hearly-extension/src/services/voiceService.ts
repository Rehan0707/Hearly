import type { VoiceProfile } from '@/utils/types';
import { loadVoiceProfile, saveVoiceProfile } from './storageService';
import { saveVoiceProfileToSupabase, fetchVoiceProfileFromSupabase, isSupabaseConfigured } from './supabaseService';
import { SPEAKER_SIMILARITY_THRESHOLD } from '@/config/constants';
import { logger } from '@/utils/logger';

/**
 * Computes an L2-normalized mean centroid vector from a set of embedding samples.
 */
export function computeSpeakerCentroid(sampleEmbeddings: (Float32Array | number[])[]): Float32Array {
  if (sampleEmbeddings.length === 0) {
    return new Float32Array(192);
  }

  const dim = sampleEmbeddings[0]?.length ?? 192;
  const mean = new Float32Array(dim);

  for (const sample of sampleEmbeddings) {
    for (let i = 0; i < dim; i++) {
      mean[i] += sample[i] ?? 0;
    }
  }

  for (let i = 0; i < dim; i++) {
    mean[i] /= sampleEmbeddings.length;
  }

  // L2 Normalization
  let sumSq = 0;
  for (let i = 0; i < dim; i++) {
    sumSq += mean[i] * mean[i];
  }

  const magnitude = Math.sqrt(sumSq);
  if (magnitude === 0) return mean;

  for (let i = 0; i < dim; i++) {
    mean[i] /= magnitude;
  }

  return mean;
}

/**
 * Computes cosine similarity between two Float32Array or number[] embedding vectors.
 */
export function cosineSimilarity(a: Float32Array | number[], b: Float32Array | number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    const valA = a[i] ?? 0;
    const valB = b[i] ?? 0;
    dot += valA * valB;
    normA += valA * valA;
    normB += valB * valB;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export async function getStoredVoiceProfile(): Promise<VoiceProfile | null> {
  const localProfile = await loadVoiceProfile();
  if (localProfile) return localProfile;

  // If local profile isn't found but Supabase is configured, attempt fetching remote profile
  if (isSupabaseConfigured()) {
    const remote = await fetchVoiceProfileFromSupabase('current-user');
    if (remote.success && remote.profile) {
      const restoredProfile: VoiceProfile = {
        id: remote.profile.id ?? `profile-${Date.now()}`,
        userName: remote.profile.profile_name,
        embedding: new Float32Array(remote.profile.embedding),
        embeddingModel: 'onnx-ready',
        enrolledAt: Date.now(),
        isActive: true,
      };
      await saveVoiceProfile(restoredProfile);
      return restoredProfile;
    }
  }

  return null;
}

export async function persistVoiceProfile(profile: VoiceProfile): Promise<void> {
  // 1. Save locally to AES-GCM encrypted Chrome storage
  await saveVoiceProfile(profile);

  // 2. Sync centroid embedding to Supabase (pgvector table) if configured
  if (isSupabaseConfigured()) {
    const embeddingArray = Array.from(profile.embedding);
    const syncResult = await saveVoiceProfileToSupabase(
      profile.id || 'default-user',
      profile.userName || 'Enrolled User',
      embeddingArray,
      SPEAKER_SIMILARITY_THRESHOLD,
    );

    if (syncResult.success) {
      logger.log('[VoiceService] Voice profile centroid synced to Supabase successfully.');
    } else {
      logger.warn('[VoiceService] Supabase voice profile sync failed:', syncResult.error);
    }
  }
}
