import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Admin client (bypasses RLS) for server-side operations
// persistSession: false prevents signInWithPassword from corrupting the client
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Separate client for user authentication (login) — keeps supabaseAdmin clean
export const supabaseAuth = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Creates a client scoped to a user's JWT
export function supabaseForUser(accessToken: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
