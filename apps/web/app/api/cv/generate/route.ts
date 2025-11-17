import { getSupabaseServer } from '@/lib/supabase'
import OpenAI from 'openai'

export async function POST(request: Request) {
  try {
    const { profileId } = await request.json()

    if (!profileId) {
      return Response.json({ error: 'Missing profileId' }, { status: 400 })
    }

    const supabase = getSupabaseServer()

    // Fetch profile and all related data
    const [profileRes, experiencesRes, educationRes, skillsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('experiences').select('*').eq('profile_id', profileId).order('order_index', { ascending: true }),
      supabase.from('education').select('*').eq('profile_id', profileId).order('start_year', { ascending: false }),
      supabase.from('skills').select('*').eq('profile_id', profileId)
    ])

    if (profileRes.error) {
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    const profile = profileRes.data
    const experiences = experiencesRes.data || []
    const education = educationRes.data || []
    const skills = skillsRes.data || []

    // Build structured data for ChatGPT
    const cvData = {
      personal: {
        name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        website: profile.website,
        headline: profile.headline,
        summary: profile.summary
      },
      experiences: experiences.map(exp => ({
        title: exp.title,
        company: exp.company,
        location: exp.location,
        startDate: exp.start_date,
        endDate: exp.is_current ? 'Present' : exp.end_date,
        description: exp.description
      })),
      education: education.map(edu => ({
        school: edu.school,
        degree: edu.degree,
        field: edu.field_of_study,
        startYear: edu.start_year,
        endYear: edu.end_year,
        description: edu.description
      })),
      skills: skills.map(s => s.skill)
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // Generate CV using ChatGPT
    const prompt = `You are a professional CV/resume writer. Generate a beautifully formatted, professional CV in HTML format based on the following data. Use professional styling, clear sections, and make it ATS-friendly.

CV Data:
${JSON.stringify(cvData, null, 2)}

Requirements:
- Generate complete HTML with inline CSS styling
- Professional, clean design
- Clear sections: Header, Summary, Experience, Education, Skills
- Use proper typography and spacing
- Make it print-friendly
- Include contact information prominently
- Format dates consistently
- Use bullet points for experience descriptions

Return ONLY the HTML, no markdown code blocks or explanations.`

    const completion = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional CV writer. Generate clean, professional HTML CVs with inline CSS.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })

    const generatedHtml = completion.choices[0]?.message?.content

    if (!generatedHtml) {
      return Response.json({ error: 'Failed to generate CV' }, { status: 500 })
    }

    // Store the generated CV in a new table or return it
    // For now, just return it
    return Response.json({
      success: true,
      html: generatedHtml,
      profileId
    })

  } catch (error: any) {
    console.error('Error generating CV:', error)
    return Response.json({ 
      error: error.message || 'Failed to generate CV' 
    }, { status: 500 })
  }
}
