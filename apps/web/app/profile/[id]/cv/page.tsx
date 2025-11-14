import React from 'react'
import { getSupabaseServer } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Props = { params: Promise<{ id: string }> }

export default async function ProfileCvPage({ params }: Props) {
  const { id: profileId } = await params

  try {
    const supabase = getSupabaseServer()

    // fetch profile and normalized rows
    const [{ data: profiles, error: pErr }, { data: experiencesRes, error: eErr }, { data: educationRes, error: edErr }, { data: skillsRes, error: skErr }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).limit(1),
      supabase.from('experiences').select('*').eq('profile_id', profileId).order('order_index', { ascending: true }),
      supabase.from('education').select('*').eq('profile_id', profileId).order('start_year', { ascending: false }),
      supabase.from('skills').select('*').eq('profile_id', profileId),
    ])

    if (pErr) {
      console.error('Error loading profile', pErr)
      return <div className="p-6">Error loading profile.</div>
    }
    if (!profiles || profiles.length === 0) return <div className="p-6">Profile not found.</div>
    const profile = profiles[0]

    const experiences = experiencesRes || []
    const education = educationRes || []
    const skills = skillsRes || []

    const fmtDate = (d: string | undefined | null) => {
      try {
        if (!d) return ''
        const dt = new Date(d)
        return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short' }).format(dt)
      } catch (e) {
        return String(d)
      }
    }

    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{profile.full_name || profile.display_name || '—'}</CardTitle>
            <CardDescription>{profile.headline || ''}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-sm text-muted-foreground">Location: <span className="font-medium">{profile.location || '—'}</span></div>
              <div className="text-sm text-muted-foreground">Email: <span className="font-medium">{profile.email || '—'}</span></div>
            </div>

            <h3 className="text-lg font-semibold">Skills</h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {Array.isArray(skills) && skills.length ? skills.map((s: any) => (
                <span key={s.id || s.skill} className="px-2 py-1 rounded bg-slate-100 text-sm text-slate-800">{s.skill}</span>
              )) : <div className="text-sm text-muted-foreground">No skills listed.</div>}
            </div>

            <h3 className="text-lg font-semibold">Experience</h3>
            <div className="space-y-4 mb-4">
              {Array.isArray(experiences) && experiences.length ? experiences.map((e: any) => (
                <div key={e.id} className="p-3 border rounded">
                  <div className="font-semibold">{e.title || '—'} — <span className="font-medium">{e.company || '—'}</span></div>
                  <div className="text-sm text-muted-foreground">{fmtDate(e.start_date)} — {e.is_current ? 'Present' : fmtDate(e.end_date)}</div>
                  {e.description && <p className="mt-2 text-sm">{e.description}</p>}
                </div>
              )) : <div className="text-sm text-muted-foreground">No experiences listed.</div>}
            </div>

            <h3 className="text-lg font-semibold">Education</h3>
            <div className="space-y-3 mb-4">
              {Array.isArray(education) && education.length ? education.map((ed: any) => (
                <div key={ed.id} className="p-3 border rounded">
                  <div className="font-semibold">{ed.school || '—'}</div>
                  <div className="text-sm text-muted-foreground">{ed.degree || ''} • {ed.start_year || ''} - {ed.end_year || ''}</div>
                  {ed.description && <p className="mt-2 text-sm">{ed.description}</p>}
                </div>
              )) : <div className="text-sm text-muted-foreground">No education listed.</div>}
            </div>

            <div className="mt-4">
              <Button variant="outline" onClick={() => { /* placeholder for actions like contact/download */ }}>
                Contact / Download
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } catch (err) {
    console.error('Error rendering profile CV', err)
    return <div className="p-6">Error loading CV.</div>
  }
}

export const runtime = 'nodejs'
