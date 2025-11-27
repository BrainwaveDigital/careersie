import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set.')
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.')
  return createClient<Database>(url, key)
}

export async function getSupabaseServerWithAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set.')
  if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.')
  
  const cookieStore = await cookies()
  
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set(name, value, options)
        } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        } catch {}
      },
    },
  })
}