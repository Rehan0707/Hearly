import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://hlwzcklxskvfdmohyzxg.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_9XEjHbVGgMCZp3atw2I7cw_mv1YvmeOnpx';

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

  // 1. Always back up to localStorage so no signups are lost locally
  try {
    const localWaitlist = JSON.parse(localStorage.getItem('hearly_waitlist') || '[]');
    localWaitlist.push(fullEntry);
    localStorage.setItem('hearly_waitlist', JSON.stringify(localWaitlist));
    console.log('[Waitlist] Saved entry to local backup:', fullEntry);
  } catch (err) {
    console.warn('[Waitlist] Failed to write to localStorage backup', err);
  }

  // 2. Insert into Supabase table 'waitlist'
  try {
    const { data, error } = await supabase.from('waitlist').insert([fullEntry]);
    if (error) {
      console.warn('[Supabase] Waitlist insert response:', error.message);
      return { success: true, error: error.message };
    }
    console.log('[Supabase] Waitlist entry saved successfully to Supabase database!');
    return { success: true, data };
  } catch (err) {
    console.error('[Supabase] Exception inserting waitlist entry:', err);
    return { success: true, error: String(err) };
  }
}
