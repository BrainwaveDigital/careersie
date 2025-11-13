import { supabaseClient } from './supabase'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import schema from '../../../../scripts/parsed-schema.json'

type ParsedPayload = {
  profile?: any,
  experiences?: any[],
  education?: any[],
  skills?: any[],
}

/**
 * Ingest parsed data as the currently authenticated user.
 * Uses the browser supabase client so RLS policies apply.
 */
export async function ingestParsedAsUser(parsed: ParsedPayload) {
  // validate payload client-side to catch problems early
  try {
    const ajv = new Ajv({ allErrors: true })
    addFormats(ajv)
    const validate = ajv.compile(schema as any)
    const ok = validate(parsed)
    if (!ok) {
      const msg = (validate.errors || []).map((e: any) => `${e.instancePath} ${e.message}`).join(', ')
      throw new Error('Invalid parsed payload: ' + msg)
    }
  } catch (e) {
    // if AJV is not available in the environment or validation fails, surface error
    if (e instanceof Error) throw e
  }
  // ensure user is logged in
  const { data: userData, error: userErr } = await supabaseClient.auth.getUser()
  if (userErr || !userData?.user) throw new Error('Not authenticated')
  const user = userData.user

  // upsert profile: try update by user_id then insert
  if (parsed.profile) {
    const safeProfile = { ...parsed.profile, user_id: user.id }
    // try update
    const { error: updErr } = await supabaseClient.from('profiles').update(safeProfile).eq('user_id', user.id)
    if (updErr) {
      // if update failed (no rows), insert
      const { error: insErr } = await supabaseClient.from('profiles').insert(safeProfile)
      if (insErr) throw insErr
    }
  }

  // ensure we have a profile id
  const { data: profilesNow, error: pErr } = await supabaseClient.from('profiles').select('id').eq('user_id', user.id).limit(1)
  if (pErr || !profilesNow || profilesNow.length === 0) throw new Error('Profile not found')
  const profileId = (profilesNow as any)[0].id

  // replace experiences/education/skills via delete+bulk-insert
  if (Array.isArray(parsed.experiences)) {
    await supabaseClient.from('experiences').delete().eq('profile_id', profileId)
    const safeExperiences = parsed.experiences.map((it: any, idx: number) => ({
      profile_id: profileId,
      order_index: idx,
      title: it.title || it.job_title || null,
      company: it.company || it.employer || null,
      start_date: it.start_date || it.start_year || null,
      end_date: it.end_date || it.end_year || null,
      is_current: !!it.is_current,
      description: it.description || null,
    }))
    if (safeExperiences.length) {
      const { error: exErr } = await supabaseClient.from('experiences').insert(safeExperiences)
      if (exErr) throw exErr
    }
  }

  if (Array.isArray(parsed.education)) {
    await supabaseClient.from('education').delete().eq('profile_id', profileId)
    const safeEducation = parsed.education.map((it: any) => ({
      profile_id: profileId,
      school: it.school || it.institution || null,
      degree: it.degree || it.qualification || null,
      start_year: it.start_year || null,
      end_year: it.end_year || null,
      description: it.description || null,
    }))
    if (safeEducation.length) {
      const { error: edErr } = await supabaseClient.from('education').insert(safeEducation)
      if (edErr) throw edErr
    }
  }

  if (Array.isArray(parsed.skills)) {
    await supabaseClient.from('skills').delete().eq('profile_id', profileId)
    const safeSkills = parsed.skills.map((it: any) => ({ profile_id: profileId, skill: typeof it === 'string' ? it : it.skill || JSON.stringify(it) }))
    if (safeSkills.length) {
      const { error: skErr } = await supabaseClient.from('skills').insert(safeSkills)
      if (skErr) throw skErr
    }
  }

  return { ok: true, profile_id: profileId }
}
