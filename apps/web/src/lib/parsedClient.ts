import { supabaseClient } from './supabase'
import { uuidv4 } from './uuid'
import type { Database } from '@/types/supabase'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import schema from '../../../../scripts/parsed-schema.json'
import { parseProfileFromText } from './llmProfileParser'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
type ParsedPayload = {
  profile?: Record<string, unknown>;
  experiences?: Record<string, unknown>[];
  education?: Record<string, unknown>[];
  skills?: (string | Record<string, unknown>)[];
  [key: string]: unknown;
}

/**
 * Ingest parsed data as the currently authenticated user.
 * Uses the browser supabase client so RLS policies apply.
 */
export async function ingestParsedAsUser(parsed: ParsedPayload) {
        // Confirm function is running and log input
        console.log('[ingestParsedAsUser] called with parsed:', JSON.stringify(parsed, null, 2));

        // GLOBAL GUARD: If parsed.profile is missing, not an object, or has no required fields, throw immediately
        const requiredFields = ['full_name', 'email', 'headline', 'summary'];
        if (!parsed.profile || typeof parsed.profile !== 'object' || Object.keys(parsed.profile).length === 0) {
          console.error('[GLOBAL GUARD] parsed.profile missing or empty:', parsed.profile, 'parsed:', parsed);
          throw new Error('Profile ingest blocked: parsed.profile missing or empty. Please review the parsed data.');
        }
        const hasAnyRequiredTop = requiredFields.some(f => parsed.profile && parsed.profile[f] && String(parsed.profile[f]).trim() !== '');
        if (!hasAnyRequiredTop) {
          console.error('[GLOBAL GUARD] parsed.profile missing all required fields:', parsed.profile, 'parsed:', parsed);
          throw new Error('Profile ingest blocked: parsed.profile missing all required fields. Please review the parsed data.');
        }
    // ensure user is logged in
    const { data: userData, error: userErr } = await supabaseClient.auth.getUser()
    if (userErr || !userData?.user) throw new Error('Not authenticated')
    const user = userData.user

    // ✅ ADD THIS: Explicitly ensure session is active
    const { data: { session } } = await supabaseClient.auth.getSession()
    if (session) {
      await supabaseClient.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      })
    }
    // Now continue with your existing code...
    console.log('[parsedClient] Full parsed object before mapping:', JSON.stringify(parsed, null, 2));
  
    // ensure a row exists in the users table for this user
    const { data: userRow, error: userRowErr } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    if (userRowErr && userRowErr.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(userRowErr.message || JSON.stringify(userRowErr) || 'Unknown error fetching user row');
    }
    if (!userRow) {
      // Insert a new user row with default status and full_name if available
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email ||
        null;
      const { error: insertUserErr } = await supabaseClient
        .from('users')
        .insert([{ id: user.id, full_name: fullName }]);
      if (insertUserErr) throw new Error(insertUserErr.message || JSON.stringify(insertUserErr) || 'Unknown error inserting user row');
    }

    // --- LLM-POWERED PROFILE EXTRACTION ---
    // If raw CV text is present, use LLM to extract accurate JSON before mapping
    // Expecting parsed.raw_cv_text or parsed.cv_text as the raw text field
    if (parsed && typeof parsed === 'object' && (parsed['raw_cv_text'] || parsed['cv_text'])) {
      try {
        const llmText = (parsed['raw_cv_text'] ?? parsed['cv_text']) as string | undefined;
        if (llmText) {
          const llmResult = await parseProfileFromText(llmText);
          // Merge all fields from LLM result into parsed (not just profile/experiences/education/skills)
          if (llmResult && typeof llmResult === 'object') {
            for (const [key, value] of Object.entries(llmResult)) {
              if (value !== undefined) (parsed as Record<string, unknown>)[key] = value;
            }
            // Optionally: delete parsed.raw_cv_text to avoid saving large blobs
            delete (parsed as Record<string, unknown>)['raw_cv_text'];
            delete (parsed as Record<string, unknown>)['cv_text'];
            console.log('[parsedClient] LLM-powered extraction result:', JSON.stringify(llmResult, null, 2));
          }
        }
        // (duplicate block removed)
      } catch (err) {
        console.error('[parsedClient] LLM extraction failed, falling back to existing parsed:', err);
      }
    }

    // --- AGGRESSIVE PROFILE FIELD MAPPING ---
    // Always map key fields from llm/extracted into parsed.profile before saving
    if (parsed && typeof parsed === 'object') {
      // Log the full parsed object before mapping
      console.log('[parsedClient] Full parsed object before mapping:', JSON.stringify(parsed, null, 2));
      if (!parsed.profile) parsed.profile = {};
      // Try to find all possible sources for profile fields
      const sources = [
        (parsed as Record<string, unknown>)['llm'] || {},
        (parsed as Record<string, unknown>)['extracted'] || {},
        (parsed.profile && (parsed.profile as Record<string, unknown>)['llm']) || {},
        (parsed.profile && (parsed.profile as Record<string, unknown>)['extracted']) || {},
        parsed.profile || {},
      ];
      const fieldMap: Record<string, string[]> = {
        full_name: ['full_name', 'name'],
        display_name: ['display_name'],
        preferred_name: ['preferred_name'],
        email: ['email'],
        phone: ['phone'],
        headline: ['headline'],
        summary: ['summary', 'professional_summary'],
        about: ['about'],
        location: ['location'],
        website: ['website'],
      };
      for (const [target, aliases] of Object.entries(fieldMap)) {
        for (const src of sources) {
          for (const alias of aliases) {
            if ((src as Record<string, unknown>)[alias] && !(parsed.profile as Record<string, unknown>)[target]) {
              (parsed.profile as Record<string, unknown>)[target] = (src as Record<string, unknown>)[alias];
              break;
            }
          }
          if ((parsed.profile as Record<string, unknown>)[target]) break;
        }
      }
      // Debug: log the final profile before save
      console.log('[parsedClient] Final mapped profile before save:', parsed.profile);
    }
  // validate payload client-side to catch problems early
  try {
    const ajv = new Ajv({ allErrors: true })
    addFormats(ajv)
    const validate = ajv.compile(schema as object)
    const ok = validate(parsed)
    if (!ok) {
      const msg = (validate.errors || []).map((e: { instancePath?: string; message?: string }) => `${e.instancePath} ${e.message}`).join(', ')
      throw new Error('Invalid parsed payload: ' + msg)
    }
  } catch (e) {
    // if AJV is not available in the environment or validation fails, surface error
    if (e instanceof Error) throw e
  }
  // REMOVE THESE 3 LINES - they're duplicates!
  // const { data: authData, error: userErr } = await supabaseClient.auth.getUser()
  // if (userErr || !authData?.user) throw new Error('Not authenticated')
  // const currentUser = authData.user
  
  // upsert profile: try update by user_id then insert
  if (parsed.profile) {

    // Whitelist of columns actually present on the `profiles` table in the DB.
    const profileFields = [
      'user_id',
      'full_name',
      'preferred_name',
      'headline',
      'summary',
      'about',
      'location',
      'website',
      'email',
      'phone',
    ];

    // Move requiredFields declaration above all uses
    const requiredFields = ['full_name', 'email', 'headline', 'summary'];

    // If the parser produced `display_name` but the DB uses `preferred_name`, map it across
    if ((parsed.profile as Record<string, unknown>)['display_name'] && !(parsed.profile as Record<string, unknown>)['preferred_name']) {
      (parsed.profile as Record<string, unknown>)['preferred_name'] = (parsed.profile as Record<string, unknown>)['display_name'];
    }

    // Build safeProfile by filtering to allowed fields only, using correct type
    const safeProfile: Record<string, unknown> = { user_id: String(user.id) };
    for (const field of profileFields) {
      if (field === 'user_id') continue; // Already set above
      const val = (parsed.profile as Record<string, unknown>)[field];
      if (val !== undefined && val !== null) {
        safeProfile[field] = val;
      }
    }

    // Defensive fallback: if safeProfile is empty or missing all required fields, set all required defaults
    let hasAnyRequired = requiredFields.some(f => {
      const v = safeProfile[f as keyof ProfileUpdate];
      return v !== undefined && v !== null && String(v).trim() !== '';
    });
    if (!hasAnyRequired) {
      safeProfile.full_name = 'Unknown User';
      safeProfile.email = user.email || 'unknown@example.com';
      safeProfile.headline = 'Profile';
      safeProfile.summary = 'No summary provided.';
      hasAnyRequired = true;
    }

    // Debug: log parsed.profile and safeProfile before final check
    console.log('[parsedClient] parsed.profile before final check:', JSON.stringify(parsed.profile, null, 2));
    console.log('[parsedClient] safeProfile before final check:', JSON.stringify(safeProfile, null, 2));

    // Hard guard: if safeProfile is empty or missing all required fields, throw error before DB operation
    const hasRequired = requiredFields.some(f => {
      const v = safeProfile[f as keyof ProfileUpdate];
      return v !== undefined && v !== null && String(v).trim() !== '';
    });
    if (!hasRequired || Object.keys(safeProfile).length === 0) {
      console.error('[Profile insert prevented] No required fields present in safeProfile:', safeProfile, 'parsed.profile:', parsed.profile);
      throw new Error('Profile insert failed: No required fields (full_name, email, headline, or summary) present. Please review the parsed data.');
    }

    // FINAL UNCONDITIONAL GUARD before DB operation
    // FINAL UNCONDITIONAL GUARD before ANY DB operation
    if (Object.keys(safeProfile).length === 0 || !requiredFields.some(f => {
      const v = safeProfile[f as keyof ProfileUpdate];
      return v !== undefined && v !== null && String(v).trim() !== '';
    })) {
      console.error('[FINAL GUARD] Attempted to update/insert empty or invalid safeProfile:', safeProfile, 'parsed.profile:', parsed.profile, 'Call stack:', new Error().stack);
      throw new Error('Profile update/insert blocked: safeProfile is empty or missing required fields. This should never happen. Please report this bug.');
    }

    // try update - ensure user.id is treated as string
    const { error: updErr, data: updData } = await supabaseClient
      .from('profiles')
      .update(safeProfile as any)
      .eq('user_id', String(user.id))
      .select('*');

    let didUpdate = false;
    if (updErr) {
      // Update failed with error, try insert
      console.error('[Profile update failed] safeProfile:', safeProfile, 'Error:', updErr, 'UpdateData:', updData);
    } else {
      didUpdate = Array.isArray(updData) && updData.length > 0;
      if (didUpdate) {
        console.log('[Profile update succeeded] safeProfile:', safeProfile, 'UpdateData:', updData);
      } else {
        console.warn('[Profile update did not affect any rows, will try insert] safeProfile:', safeProfile);
      }
    }

    // FINAL UNCONDITIONAL GUARD before INSERT
    if (!didUpdate && (Object.keys(safeProfile).length === 0 || !requiredFields.some(f => {
      const v = safeProfile[f as keyof ProfileUpdate];
      return v !== undefined && v !== null && String(v).trim() !== '';
    }))) {
      console.error('[FINAL GUARD - INSERT] Attempted to insert empty or invalid safeProfile:', safeProfile, 'parsed.profile:', parsed.profile, 'Call stack:', new Error().stack);
      throw new Error('Profile insert blocked: safeProfile is empty or missing required fields. This should never happen. Please report this bug.');
    }

    if (updErr || !didUpdate) {
      // Insert requires id
      const profileInsert = { ...safeProfile, id: uuidv4() };
      const { error: insErr, data: insData } = await supabaseClient.from('profiles').insert(profileInsert as any);
      if (insErr) {
        console.error('[Profile insert failed] safeProfile:', profileInsert, 'Error:', insErr, 'InsertData:', insData);
        throw new Error('Profile insert failed: ' + (insErr.message || JSON.stringify(insErr)));
      } else {
        console.log('[Profile insert succeeded] safeProfile:', profileInsert, 'InsertData:', insData);
      }
    }
  }

  // ensure we have a profile id
  const { data: profilesNow, error: pErr } = await supabaseClient.from('profiles').select('id').eq('user_id', user.id).limit(1)
  if (pErr) throw new Error(pErr.message || JSON.stringify(pErr) || 'Unknown error fetching profiles')
  if (!profilesNow || profilesNow.length === 0) throw new Error('Profile not found after ingest')
  const firstProfile = (profilesNow as Record<string, unknown>[])[0];
  if (!firstProfile || !firstProfile.id) throw new Error('Profile not found after ingest');
  const profileId = firstProfile.id as string;

  // replace experiences/education/skills via delete+bulk-insert
  // Always use profileId (not user_id) for all subsections
  if (Array.isArray(parsed.experiences)) {
    await supabaseClient.from('experiences').delete().eq('profile_id', profileId);
    const safeExperiences = parsed.experiences.map((it, idx: number) => ({
      id: uuidv4(),
      profile_id: profileId,
      order_index: idx,
      title: (it as Record<string, unknown>).title?.toString() || (it as Record<string, unknown>).job_title?.toString() || null,
      company: (it as Record<string, unknown>).company?.toString() || (it as Record<string, unknown>).employer?.toString() || null,
      start_date: (it as Record<string, unknown>).start_date?.toString() || (it as Record<string, unknown>).start_year?.toString() || null,
      end_date: (it as Record<string, unknown>).end_date?.toString() || (it as Record<string, unknown>).end_year?.toString() || null,
      is_current: !!(it as Record<string, unknown>).is_current,
      description: (it as Record<string, unknown>).description?.toString() || null,
    }));
    if (safeExperiences.length) {
      const { error: exErr } = await supabaseClient.from('experiences').insert(safeExperiences);
      if (exErr) throw new Error(exErr.message || JSON.stringify(exErr));
    }
  }

  if (Array.isArray(parsed.education)) {
    await supabaseClient.from('education').delete().eq('profile_id', profileId);
    const safeEducation = parsed.education.map((it) => ({
      id: uuidv4(),
      profile_id: profileId,
      school: (it as Record<string, unknown>).school?.toString() || (it as Record<string, unknown>).institution?.toString() || null,
      degree: (it as Record<string, unknown>).degree?.toString() || (it as Record<string, unknown>).qualification?.toString() || null,
      start_year: (it as Record<string, unknown>).start_year ? Number((it as Record<string, unknown>).start_year) : null,
      end_year: (it as Record<string, unknown>).end_year ? Number((it as Record<string, unknown>).end_year) : null,
      description: (it as Record<string, unknown>).description?.toString() || null,
    }));
    if (safeEducation.length) {
      const { error: edErr } = await supabaseClient.from('education').insert(safeEducation);
      if (edErr) throw new Error(edErr.message || JSON.stringify(edErr));
    }
  }

  if (Array.isArray(parsed.skills)) {
    await supabaseClient.from('skills').delete().eq('profile_id', profileId);
    const safeSkills = parsed.skills.map((it) => ({
      id: uuidv4(),
      profile_id: profileId,
      skill: typeof it === 'string' ? it : (it as Record<string, unknown>).skill?.toString() || JSON.stringify(it)
    }));
    if (safeSkills.length) {
      const { error: skErr } = await supabaseClient.from('skills').insert(safeSkills);
      if (skErr) throw new Error(skErr.message || JSON.stringify(skErr));
    }
  }

  return { ok: true, profile_id: profileId }
}
