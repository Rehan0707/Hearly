import { logger } from '@/utils/logger';

export interface SupabaseVoiceProfile {
  id?: string;
  user_id: string;
  profile_name: string;
  embedding: number[];
  similarity_threshold: number;
  created_at?: string;
}

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || '';

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Stores or updates a user's 192D ECAPA-TDNN speaker centroid vector in Supabase (pgvector).
 */
export async function saveVoiceProfileToSupabase(
  userId: string,
  profileName: string,
  embedding: number[],
  threshold: number = 0.68,
): Promise<{ success: boolean; data?: SupabaseVoiceProfile; error?: string }> {
  if (!isSupabaseConfigured()) {
    logger.info('[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not configured. Skipping remote sync.');
    return { success: false, error: 'Supabase credentials not configured.' };
  }

  try {
    const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/voice_profiles`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        user_id: userId,
        profile_name: profileName,
        embedding,
        similarity_threshold: threshold,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error('[Supabase] Failed to save voice profile:', response.status, errText);
      return { success: false, error: `Supabase error (${response.status}): ${errText}` };
    }

    const data = (await response.json()) as SupabaseVoiceProfile[];
    return { success: true, data: data[0] };
  } catch (error) {
    logger.error('[Supabase] Network exception while saving profile:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Fetches the user's latest voice profile embedding vector from Supabase.
 */
export async function fetchVoiceProfileFromSupabase(
  userId: string,
): Promise<{ success: boolean; profile?: SupabaseVoiceProfile; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials not configured.' };
  }

  try {
    const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/voice_profiles?user_id=eq.${encodeURIComponent(
      userId,
    )}&select=*&order=created_at.desc&limit=1`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `Supabase query error (${response.status}): ${errText}` };
    }

    const data = (await response.json()) as SupabaseVoiceProfile[];
    if (!data || data.length === 0) {
      return { success: false, error: 'No voice profile found in Supabase for user.' };
    }

    return { success: true, profile: data[0] };
  } catch (error) {
    logger.error('[Supabase] Exception fetching voice profile:', error);
    return { success: false, error: String(error) };
  }
}
