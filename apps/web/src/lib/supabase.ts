import { createClient } from '@supabase/supabase-js'

// Create a browser supabase client only when the required env vars are present.
// During server build (Vercel) these may be undefined; avoid calling createClient at import time
// to prevent build-time errors like "supabaseUrl is required".
const _browserUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const _anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabaseClient = (_browserUrl && _anonKey)
  ? createClient(_browserUrl, _anonKey)
  : // lightweight proxy that throws a helpful error when used without envs
    new Proxy({}, {
      get() {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. The Supabase browser client is unavailable during build. Ensure these env vars are configured in Vercel (Preview/Production).')
      }
    }) as any
