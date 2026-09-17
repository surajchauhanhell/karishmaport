import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export const requireSupabase = () => {
  if (!supabase)
    throw new Error('The online service is not connected yet. Please contact Karishma by email.');
  return supabase;
};
