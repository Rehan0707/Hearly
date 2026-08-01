import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hlwzcklxskvfdmohyzxg.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsd3pja2x4c2t2ZmRtb2h5enhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MjM5NjEsImV4cCI6MjEwMDk5OTk2MX0.IhvGP4YeXXj2FjBqtb2DA7trE0FLwXdHoxPkExoGJ4M';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Saves a waitlist submission directly to Supabase table: waitlist.
 * @param {{ email: string; use_case: string; interested_plan?: string }} entry
 */
export async function submitWaitlistEntry(entry) {
  const timestamp = new Date().toISOString();
  const normalizedEmail = (entry.email || '').trim().toLowerCase();

  const fullEntry = {
    email: normalizedEmail,
    use_case: entry.use_case || 'Student',
    interested_plan: entry.interested_plan || 'Basic',
    created_at: timestamp,
  };

  console.log('[Supabase] Submitting entry directly to database:', fullEntry);

  // 1. Direct fetch call to Supabase REST API to guarantee connection
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(fullEntry),
    });

    if (res.status === 201) {
      const data = await res.json();
      console.log('[Supabase REST] Entry saved successfully:', data);
      return { success: true, data };
    }

    if (res.status === 409) {
      const errorText = await res.text();
      console.warn('[Supabase REST] Duplicate email blocked by database:', errorText);
      return { success: false, isDuplicate: true, message: 'You have already joined the Hearly waitlist with this email address.' };
    }

    const errorText = await res.text();
    console.warn('[Supabase REST] Response warning:', res.status, errorText);
  } catch (err) {
    console.error('[Supabase REST] Exception:', err);
  }

  // 2. Fallback to Supabase JS Client SDK
  try {
    const { data, error } = await supabase.from('waitlist').insert([fullEntry]);

    if (error) {
      if (error.code === '23505' || error.message.toLowerCase().includes('duplicate') || error.message.toLowerCase().includes('unique')) {
        return { success: false, isDuplicate: true, message: 'You have already joined the Hearly waitlist with this email address.' };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[Supabase SDK] Exception:', err);
    return { success: false, error: String(err) };
  }
}
