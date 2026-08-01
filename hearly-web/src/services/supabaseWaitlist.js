import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hlwzcklxskvfdmohyzxg.supabase.co';
// Standard public anon key (Restricted by Supabase RLS: INSERT ONLY, NO SELECT/DELETE)
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsd3pja2x4c2t2ZmRtb2h5enhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MjM5NjEsImV4cCI6MjEwMDk5OTk2MX0.IhvGP4YeXXj2FjBqtb2DA7trE0FLwXdHoxPkExoGJ4M';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Saves a waitlist submission to Supabase (table: waitlist) and localStorage backup.
 * @param {{ email: string; use_case: string; interested_plan?: string }} entry
 */
export async function submitWaitlistEntry(entry) {
  const timestamp = new Date().toISOString();
  const fullEntry = {
    email: (entry.email || '').trim().toLowerCase(),
    use_case: entry.use_case || 'Student',
    interested_plan: entry.interested_plan || 'Basic',
    created_at: timestamp,
  };

  // 1. Always back up to localStorage so signups are never lost
  try {
    const localWaitlist = JSON.parse(localStorage.getItem('hearly_waitlist') || '[]');
    localWaitlist.push(fullEntry);
    localStorage.setItem('hearly_waitlist', JSON.stringify(localWaitlist));
  } catch (err) {
    console.warn('[Waitlist] Failed to write to localStorage backup', err);
  }

  // 2. Insert into Supabase table 'waitlist' using public anon key
  try {
    const { data, error } = await supabase.from('waitlist').insert([fullEntry]);
    if (error) {
      console.warn('[Supabase] Waitlist insert error:', error.message);
      return { success: true, error: error.message };
    }
    console.log('[Supabase] Waitlist entry saved successfully!');
    return { success: true, data };
  } catch (err) {
    console.error('[Supabase] Exception inserting waitlist entry:', err);
    return { success: true, error: String(err) };
  }
}
