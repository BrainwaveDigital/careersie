import { getSupabaseServer } from '@/lib/supabase'
import OpenAI from 'openai'

export async function POST(request: Request) {
  try {
    const { profileId, format = 'professional' } = await request.json()

    if (!profileId) {
      return Response.json({ error: 'Profile ID is required' }, { status: 400 })
    }

    const supabase = getSupabaseServer()

    // Fetch all profile data
    const [
      { data: profile, error: profileError },
      { data: experiences, error: expError },
      { data: education, error: eduError },
      { data: skills, error: skillError }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('experiences').select('*').eq('profile_id', profileId).order('order_index', { ascending: true }),
      supabase.from('education').select('*').eq('profile_id', profileId).order('start_year', { ascending: false }),
      supabase.from('skills').select('*').eq('profile_id', profileId)
    ])

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Assemble structured data
    const cvData = {
      personal: {
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        website: profile.website,
        headline: profile.headline
      },
      summary: profile.summary,
      experiences: (experiences || []).map(e => ({
        title: e.title,
        company: e.company,
        location: e.location,
        start_date: e.start_date,
        end_date: e.end_date,
        is_current: e.is_current,
        description: e.description
      })),
      education: (education || []).map(e => ({
        school: e.school,
        degree: e.degree,
        field_of_study: e.field_of_study,
        start_year: e.start_year,
        end_year: e.end_year,
        description: e.description
      })),
      skills: (skills || []).map(s => s.skill)
    }

    // Check if OpenAI is configured
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      console.warn('OPENAI_API_KEY not configured, returning structured data only')
      return Response.json({
        success: true,
        formatted: false,
        data: cvData,
        message: 'CV data assembled but not formatted (OpenAI not configured)'
      })
    }

    // Generate formatted CV using OpenAI
    const openai = new OpenAI({ apiKey: openaiKey })
    
    const prompt = `You are a professional CV formatter. Generate a well-formatted, ATS-friendly CV in Markdown format based on the following information.

Use a ${format} style with:
- Clear section headers
- Bullet points for experiences and achievements
- Proper date formatting
- Professional tone
- Optimized for applicant tracking systems (ATS)

CV Data:
${JSON.stringify(cvData, null, 2)}

Generate ONLY the formatted CV content in Markdown. Do not include any preamble or explanation.`

    const completion = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert CV formatter who creates professional, ATS-friendly CVs.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 3000
    })

    const formattedCV = completion.choices[0]?.message?.content || ''

    // Update profile with generation timestamp
    await supabase
      .from('profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', profileId)

    return Response.json({
      success: true,
      formatted: true,
      data: cvData,
      markdown: formattedCV,
      message: 'CV generated successfully'
    })

  } catch (error: any) {
    console.error('Error generating CV:', error)
    return Response.json({
      error: 'Failed to generate CV',
      details: error.message
    }, { status: 500 })
  }
}

export const runtime = 'nodejs'
