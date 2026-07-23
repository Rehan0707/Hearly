/**
 * Real-time Speaker Diarization Engine for Hearly v2.
 * Categorizes incoming audio chunks into [Me], [Speaker B], [Speaker C], or [Unknown].
 */

import { ProfileManager } from './profileManager';

export interface SpeakerTag {
  id: string;
  label: string;
  isEnrolledUser: boolean;
  color: string;
}

const SPEAKER_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

export class DiarizationEngine {
  private profileManager: ProfileManager;
  private knownSpeakers: Map<string, number[]> = new Map();
  private speakerCounter: number = 1;

  constructor(profileManager: ProfileManager) {
    this.profileManager = profileManager;
  }

  /**
   * Diarizes an audio frame given its speaker embedding vector.
   */
  public identifySpeaker(embedding: number[]): SpeakerTag {
    const activeProfile = this.profileManager.getActiveProfile();
    const verification = this.profileManager.verifyCandidate(embedding);

    if (verification.isMatch && activeProfile) {
      return {
        id: activeProfile.id,
        label: `${activeProfile.name} (Me)`,
        isEnrolledUser: true,
        color: '#6366F1', // Indigo for enrolled user
      };
    }

    // Match against previously observed unknown speaker clusters
    let matchedSpeakerId: string | null = null;
    let maxSim = 0.65; // Minimum similarity threshold for speaker cluster assignment

    this.knownSpeakers.forEach((knownEmb, speakerId) => {
      const sim = this.profileManager.cosineSimilarity(embedding, knownEmb);
      if (sim > maxSim) {
        maxSim = sim;
        matchedSpeakerId = speakerId;
      }
    });

    if (matchedSpeakerId !== null) {
      const speakerIdStr: string = matchedSpeakerId;
      const index = parseInt(speakerIdStr.replace('speaker_', ''), 10) || 1;
      return {
        id: speakerIdStr,
        label: `Speaker ${String.fromCharCode(64 + index)}`,
        isEnrolledUser: false,
        color: SPEAKER_COLORS[(index - 1) % SPEAKER_COLORS.length],
      };
    }

    // Assign new speaker cluster
    const newSpeakerId = `speaker_${this.speakerCounter++}`;
    this.knownSpeakers.set(newSpeakerId, embedding);
    const index = this.speakerCounter - 1;

    return {
      id: newSpeakerId,
      label: `Speaker ${String.fromCharCode(64 + index)}`,
      isEnrolledUser: false,
      color: SPEAKER_COLORS[(index - 1) % SPEAKER_COLORS.length],
    };
  }

  public resetClusters(): void {
    this.knownSpeakers.clear();
    this.speakerCounter = 1;
  }
}
