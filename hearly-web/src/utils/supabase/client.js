import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://hlwzcklxskvfdmohyzxg.supabase.co';

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsd3pja2x4c2t2ZmRtb2h5enhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MjM5NjEsImV4cCI6MjEwMDk5OTk2MX0.IhvGP4YeXXj2FjBqtb2DA7trE0FLwXdHoxPkExoGJ4M';

export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey);
