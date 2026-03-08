// ─────────────────────────────────────────────────────────────
//  DAB AI – Supabase Client Singleton
// ─────────────────────────────────────────────────────────────
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_ANON    = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    '❌  Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.'
  );
}

// Public client – respects RLS (use for user-facing queries)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// Admin client – bypasses RLS (use for server-side writes / admin ops)
const supabaseAdmin = SUPABASE_SERVICE
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : supabase; // fallback to anon if no service key provided

module.exports = { supabase, supabaseAdmin };
