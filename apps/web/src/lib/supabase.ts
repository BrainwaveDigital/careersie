import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const _browserUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const _anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabaseClient = (_browserUrl && _anonKey)
  ? createClient<Database>(_browserUrl, _anonKey)
  : new Proxy({}, {
      get() {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set.')
      }
    }) as any