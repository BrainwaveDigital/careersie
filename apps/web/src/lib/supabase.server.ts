import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Server-side client factory. Validates required env vars and returns a client when called.
export function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. Set this in your environment or Vercel project settings.')
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Set this in your environment or Vercel project settings.')
  return createClient(url, key)
}

// Server-side client with authentication from cookies (for API routes)
// Use this for authenticated requests that need to respect RLS policies
export async function getSupabaseServerWithAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set.')
  if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.')
  
  const cookieStore = await cookies()
  
  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set(name, value, options)
        } catch {
          // Cookie setting might fail in some contexts (like API routes)
          // This is okay - the session is already established
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        } catch {
          // Cookie removal might fail in some contexts
        }
      },
    },
  })
}
