import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase URL or Anon Key is missing. Storage uploads will fail.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
