const { createClient } = require('@supabase/supabase-js')

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment before running this script.')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  const userId = process.argv[2] || `test-user-${Date.now()}`
  console.log('Using user_id:', userId)

  // Upsert profile
  const profile = {
    user_id: userId,
    full_name: 'Test User',
    display_name: 'Test User',
    email: `test+${Date.now()}@example.com`,
    headline: 'Generated test profile',
    location: 'Localhost'
  }

  const { error: upErr } = await supabase.from('profiles').upsert(profile, { onConflict: 'user_id' })
  if (upErr) {
    console.error('Failed to upsert profile', upErr)
    process.exit(1)
  }

  const { data: profilesNow, error: pErr } = await supabase.from('profiles').select('id').eq('user_id', userId).limit(1)
  if (pErr || !profilesNow || profilesNow.length === 0) {
    console.error('Could not fetch profile id', pErr)
    process.exit(1)
  }
  const profileId = profilesNow[0].id
  console.log('Profile id:', profileId)

  // Insert sample experiences
  const experiences = [
    { profile_id: profileId, order_index: 0, title: 'Software Engineer', company: 'Acme', start_date: '2020-01-01', end_date: '2022-12-31', description: 'Worked on things.' },
    { profile_id: profileId, order_index: 1, title: 'Senior Engineer', company: 'Globex', start_date: '2023-01-01', is_current: true, description: 'Leading stuff.' }
  ]
  const { error: exErr } = await supabase.from('experiences').insert(experiences)
  if (exErr) console.error('Error inserting experiences', exErr)
  else console.log('Inserted experiences')

  const education = [
    { profile_id: profileId, school: 'State University', degree: 'BSc', start_year: 2015, end_year: 2019 }
  ]
  const { error: edErr } = await supabase.from('education').insert(education)
  if (edErr) console.error('Error inserting education', edErr)
  else console.log('Inserted education')

  const skills = [
    { profile_id: profileId, skill: 'JavaScript' },
    { profile_id: profileId, skill: 'Node.js' }
  ]
  const { error: skErr } = await supabase.from('skills').insert(skills)
  if (skErr) console.error('Error inserting skills', skErr)
  else console.log('Inserted skills')

  console.log('Test ingest complete')
}

main().catch((e) => {
  console.error('Test ingest failed', e)
  process.exit(1)
})
