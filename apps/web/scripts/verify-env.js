#!/usr/bin/env node
// Load .env.local if present
import('dotenv').then(dotenv => {
  dotenv.config({ path: '.env.local' })
  main()
})

function main() {
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  // service role key is required for server-side operations (download endpoints, worker),
  // but it may not be present in Preview builds depending on your Vercel setup. Recommend setting it.
  'SUPABASE_SERVICE_ROLE_KEY'
]

  const missing = required.filter((k) => !process.env[k])
  if (missing.length === 0) {
    console.log('All required environment variables are present.')
    process.exit(0)
  }

  console.error('Missing required environment variables:')
  for (const k of missing) console.error('  -', k)

  console.error('\nPlease add them to your Vercel project (Settings → Environment Variables) for the relevant environment (Preview/Production).')
  process.exit(2)
}
