import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

// Minimal helper: extract access token from Authorization header or cookie header
function extractTokenFromHeaders(headers: Headers) {
  const auth = headers.get('authorization')
  if (auth && auth.startsWith('Bearer ')) return auth.split(' ')[1]

  const cookieHeader = headers.get('cookie')
  if (!cookieHeader) return null

  const cookieNames = ['sb:token', 'sb-access-token', 'sb-session', 'supabase-auth-token', 'sb:session', 'access_token']
  const parts = cookieHeader.split(/;\s*/)
  for (const part of parts) {
    const [k, ...vParts] = part.split('=')
    const name = k?.trim()
    const val = vParts.join('=')
    if (!name) continue
    if (!cookieNames.includes(name)) continue
    try {
      const decoded = decodeURIComponent(val || '')
      const parsed = JSON.parse(decoded)
      if (parsed && parsed.access_token) return parsed.access_token
    } catch (e) {
      // not JSON, return raw
      return decodeURIComponent(val || '')
    }
  }
  return null
}

export async function POST(req: Request) {
  try {
    // Validate payload against JSON Schema to avoid bad data
    const schemaPath = path.join(process.cwd(), 'scripts', 'parsed-schema.json')
    let schema: any = null
    try {
      schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))
    } catch (e) {
      console.warn('Failed to load parsed schema for validation', e)
    }

    const ajv = new Ajv({ allErrors: true })
    addFormats(ajv)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })

    const token = extractTokenFromHeaders(req.headers)
    if (!token) return NextResponse.json({ error: 'Unauthorized. Missing session token.' }, { status: 401 })

    // validate token with Supabase /auth/v1/user
    const userRes = await fetch(new URL('/auth/v1/user', supabaseUrl).toString(), {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey }
    })
    if (!userRes.ok) return NextResponse.json({ error: 'Unauthorized. Invalid session.' }, { status: 401 })
    const user = await userRes.json()
    const userId = user?.id
    if (!userId) return NextResponse.json({ error: 'Unauthorized. Unable to determine user.' }, { status: 401 })

    const body = await req.json()
    // run schema validation if available
    if (schema) {
      const validate = ajv.compile(schema)
      const valid = validate(body)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid payload', details: validate.errors }, { status: 400 })
      }
    }
    // expected shape: { profile?: {...}, experiences?: [...], education?: [...], skills?: [...] }
    const profilePayload = body.profile || null
    const experiencesPayload = Array.isArray(body.experiences) ? body.experiences : []
    const educationPayload = Array.isArray(body.education) ? body.education : []
    const skillsPayload = Array.isArray(body.skills) ? body.skills : []

    const supabase = getSupabaseServer()

    // Ensure profile is created/updated and tied to this user
    if (profilePayload) {
      const safeProfile = { ...profilePayload, user_id: userId }
      // try update first
      const { data: existing, error: selErr } = await supabase.from('profiles').select('id').eq('user_id', userId).limit(1)
      if (selErr) {
        console.error('Error checking existing profile', selErr)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
      if (existing && existing.length > 0) {
        const { error: upErr } = await supabase.from('profiles').update(safeProfile).eq('user_id', userId)
        if (upErr) {
          console.error('Error updating profile', upErr)
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }
      } else {
        const { error: insErr } = await supabase.from('profiles').insert(safeProfile)
        if (insErr) {
          console.error('Error inserting profile', insErr)
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }
      }
    }

    // If profile exists get its id
    const { data: profilesNow, error: pErr } = await supabase.from('profiles').select('id').eq('user_id', userId).limit(1)
    if (pErr || !profilesNow || profilesNow.length === 0) {
      return NextResponse.json({ error: 'Profile not found after upsert' }, { status: 500 })
    }
  const profileId = (profilesNow as any)[0].id

    // Replace experiences / education / skills for this profile to avoid duplicates
    // Delete existing rows for profile
    try {
      await supabase.from('experiences').delete().eq('profile_id', profileId)
      await supabase.from('education').delete().eq('profile_id', profileId)
      await supabase.from('skills').delete().eq('profile_id', profileId)
    } catch (e) {
      console.warn('Failed to delete existing normalized rows', e)
    }

    // Prepare bulk inserts (ensure profile_id and safe fields)
    const safeExperiences = experiencesPayload.map((it: any, idx: number) => ({
      profile_id: profileId,
      order_index: idx,
      title: it.title || it.job_title || null,
      company: it.company || it.employer || null,
      start_date: it.start_date || it.start_year || null,
      end_date: it.end_date || it.end_year || null,
      is_current: !!it.is_current,
      description: it.description || null,
    }))

    const safeEducation = educationPayload.map((it: any) => ({
      profile_id: profileId,
      school: it.school || it.institution || null,
      degree: it.degree || it.qualification || null,
      start_year: it.start_year || null,
      end_year: it.end_year || null,
      description: it.description || null,
    }))

    const safeSkills = skillsPayload.map((it: any) => ({
      profile_id: profileId,
      skill: typeof it === 'string' ? it : it.skill || JSON.stringify(it),
    }))

    if (safeExperiences.length) {
      const { error: exErr } = await supabase.from('experiences').insert(safeExperiences)
      if (exErr) console.error('Error inserting experiences', exErr)
    }
    if (safeEducation.length) {
      const { error: edErr } = await supabase.from('education').insert(safeEducation)
      if (edErr) console.error('Error inserting education', edErr)
    }
    if (safeSkills.length) {
      const { error: skErr } = await supabase.from('skills').insert(safeSkills)
      if (skErr) console.error('Error inserting skills', skErr)
    }

    return NextResponse.json({ ok: true, profile_id: profileId })
  } catch (err) {
    console.error('ingest error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
