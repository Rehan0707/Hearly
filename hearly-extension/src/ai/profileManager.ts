/**
 * Multi-Voice Profile Manager for Hearly v2.
 * Supports incremental enrollment, multiple speaker profiles, dynamic similarity thresholds, and active profile selection.
 */

export interface SpeakerProfile {
  id: string;
  name: string;
  embedding: number[];
  createdAt: number;
  sampleCount: number;
  qualityScore: number;
}

export const DEFAULT_SIMILARITY_THRESHOLD = 0.72;

export class ProfileManager {
  private profiles: Map<string, SpeakerProfile> = new Map();
  private activeProfileId: string | null = null;
  private similarityThreshold: number = DEFAULT_SIMILARITY_THRESHOLD;

  constructor(initialProfiles: SpeakerProfile[] = [], activeId?: string) {
    initialProfiles.forEach((p) => this.profiles.set(p.id, p));
    if (activeId && this.profiles.has(activeId)) {
      this.activeProfileId = activeId;
    } else if (initialProfiles.length > 0) {
      this.activeProfileId = initialProfiles[0].id;
    }
  }

  public setThreshold(threshold: number): void {
    this.similarityThreshold = Math.max(0.0, Math.min(1.0, threshold));
  }

  public getThreshold(): number {
    return this.similarityThreshold;
  }

  public addProfile(profile: SpeakerProfile): void {
    this.profiles.set(profile.id, profile);
    if (!this.activeProfileId) {
      this.activeProfileId = profile.id;
    }
  }

  public setActiveProfile(profileId: string): boolean {
    if (this.profiles.has(profileId)) {
      this.activeProfileId = profileId;
      return true;
    }
    return false;
  }

  public getActiveProfile(): SpeakerProfile | null {
    if (!this.activeProfileId) return null;
    return this.profiles.get(this.activeProfileId) || null;
  }

  public getAllProfiles(): SpeakerProfile[] {
    return Array.from(this.profiles.values());
  }

  public deleteProfile(profileId: string): boolean {
    const deleted = this.profiles.delete(profileId);
    if (this.activeProfileId === profileId) {
      const remaining = Array.from(this.profiles.keys());
      this.activeProfileId = remaining.length > 0 ? remaining[0] : null;
    }
    return deleted;
  }

  /**
   * Calculates cosine similarity score between candidate embedding and active profile.
   */
  public verifyCandidate(candidateEmbedding: number[]): { isMatch: boolean; score: number } {
    const active = this.getActiveProfile();
    if (!active || !active.embedding || active.embedding.length === 0) {
      return { isMatch: false, score: 0.0 };
    }

    const score = this.cosineSimilarity(candidateEmbedding, active.embedding);
    return {
      isMatch: score >= this.similarityThreshold,
      score,
    };
  }

  /**
   * Computes incremental mean vector for profile enrollment.
   */
  public appendEnrollmentSample(profileId: string, sampleEmbedding: number[]): SpeakerProfile | null {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;

    const currentCount = profile.sampleCount;
    const newCount = currentCount + 1;

    // Running average vector
    const updatedEmbedding = profile.embedding.map((val, idx) => {
      const sampleVal = sampleEmbedding[idx] || 0;
      return (val * currentCount + sampleVal) / newCount;
    });

    // L2 normalize
    const norm = Math.sqrt(updatedEmbedding.reduce((sum, v) => sum + v * v, 0)) || 1.0;
    const normalizedEmbedding = updatedEmbedding.map((v) => v / norm);

    const updatedProfile: SpeakerProfile = {
      ...profile,
      embedding: normalizedEmbedding,
      sampleCount: newCount,
      qualityScore: Math.min(1.0, newCount / 5.0),
    };

    this.profiles.set(profileId, updatedProfile);
    return updatedProfile;
  }

  public cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0.0;
    let dot = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0.0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
