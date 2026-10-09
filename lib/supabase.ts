import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && key);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    if (!url || !key) throw new Error('Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
    // Only admins sign in; keeping their session in the browser lets /admin survive a reload.
    const browser = typeof window !== 'undefined';
    client = createClient(url, key, {
      auth: { persistSession: browser, autoRefreshToken: browser, storageKey: 'hu.auth' },
    });
  }
  return client;
}
