#!/usr/bin/env node
// DB snapshot helper for debugging parsing pipeline
// Prints counts and recent rows for parsed_documents, parsing_jobs and normalized tables
require('./load-env')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function run() {
  try {
    console.log('Fetching parsed_documents status counts...')
    // simple counts by status
    const { data: countsData, error: countsErr } = await supabase.from('parsed_documents').select('status', { count: 'exact' })
    if (countsErr) console.warn('counts query error', countsErr)
    else console.log('parsed_documents sample count (rows returned):', countsData.length)

    console.log('\nTop 20 parsed_documents by parsed_at DESC NULLS LAST:')
    const { data: pd, error: pdErr } = await supabase.from('parsed_documents').select('id,user_id,profile_id,file_name,status,parsed_at,created_at').order('parsed_at', { ascending: false }).limit(20)
    if (pdErr) console.error('parsed_documents query error', pdErr)
    else console.log(JSON.stringify(pd, null, 2))

    console.log('\nTop 20 parsing_jobs by created_at DESC:')
    const { data: jobs, error: jErr } = await supabase.from('parsing_jobs').select('id,parsed_document_id,status,attempts,created_at,started_at,finished_at').order('created_at', { ascending: false }).limit(20)
    if (jErr) console.error('parsing_jobs query error', jErr)
    else console.log(JSON.stringify(jobs, null, 2))

    // For each of the most recent parsed_documents, check linked profile and normalized rows
    const recent = pd || []
    for (const doc of recent.slice(0, 5)) {
      console.log(`\n--- Details for parsed_document ${doc.id} (user_id=${doc.user_id}, profile_id=${doc.profile_id}) ---`)
      if (doc.user_id) {
        const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').eq('user_id', doc.user_id).limit(10)
        console.log('profiles for user:', pErr || profiles)
      }
      if (doc.profile_id) {
        const { data: ex, error: exErr } = await supabase.from('experiences').select('*').eq('profile_id', doc.profile_id).limit(50)
        console.log('experiences for profile:', exErr || ex)
        const { data: ed, error: edErr } = await supabase.from('education').select('*').eq('profile_id', doc.profile_id).limit(50)
        console.log('education for profile:', edErr || ed)
        const { data: sk, error: skErr } = await supabase.from('skills').select('*').eq('profile_id', doc.profile_id).limit(200)
        console.log('skills for profile:', skErr || sk)
      } else {
        console.log('No profile_id on parsed_document; checking profiles by user_id and their normalized rows if any...')
        if (doc.user_id) {
          const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').eq('user_id', doc.user_id).limit(10)
          if (pErr) console.log('profiles lookup error', pErr)
          else {
            for (const p of profiles) {
              console.log('Found profile', p.id, '-> checking normalized rows')
              const { data: ex, error: exErr } = await supabase.from('experiences').select('*').eq('profile_id', p.id).limit(50)
              console.log('experiences:', exErr || ex)
              const { data: ed, error: edErr } = await supabase.from('education').select('*').eq('profile_id', p.id).limit(50)
              console.log('education:', edErr || ed)
              const { data: sk, error: skErr } = await supabase.from('skills').select('*').eq('profile_id', p.id).limit(200)
              console.log('skills:', skErr || sk)
            }
          }
        }
      }
    }

  } catch (err) {
    console.error('db-snapshot error', err)
  }
}

run()
