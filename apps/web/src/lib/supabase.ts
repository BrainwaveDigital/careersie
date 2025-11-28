import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const _browserUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const _anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabaseClient: SupabaseClient<Database> = (_browserUrl && _anonKey)
  ? createBrowserClient<Database>(_browserUrl, _anonKey)
  : new Proxy({} as SupabaseClient<Database>, {
      get() {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set.')
      }
    })