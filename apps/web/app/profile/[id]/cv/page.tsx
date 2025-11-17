import React from 'react'
import Link from 'next/link'
import { getSupabaseServer } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, ArrowLeft } from 'lucide-react'
import GenerateCVButton from './GenerateCVButton'

type Props = { params: Promise<{ id: string }> }

export default async function ProfileCvPage({ params }: Props) {
  const { id: profileId } = await params

  try {
    const supabase = getSupabaseServer()

    // fetch profile and normalized rows
    const [
      { data: profiles, error: pErr },
      { data: experiencesRes },
      { data: educationRes },
      { data: skillsRes },
      { data: certificationsRes },
      { data: membershipsRes },
      { data: voluntaryRes }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).limit(1),
      supabase.from('experiences').select('*').eq('profile_id', profileId).order('order_index', { ascending: true }),
      supabase.from('education').select('*').eq('profile_id', profileId).order('start_year', { ascending: false }),
      supabase.from('skills').select('*').eq('profile_id', profileId),
      supabase.from('certifications').select('*').eq('profile_id', profileId),
      supabase.from('organizations').select('*').eq('profile_id', profileId).eq('raw_json->>type', 'membership'),
      supabase.from('organizations').select('*').eq('profile_id', profileId).eq('raw_json->>type', 'voluntary')
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
    const certifications = certificationsRes || []
    const memberships = membershipsRes || []
    const voluntary = voluntaryRes || []

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
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Navigation Bar */}
          <div className="mb-6 flex gap-2 items-center">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link href="/profile/manual" className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Profile
              </Link>
            </Button>
          </div>

          {/* Personal Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{profile.full_name || profile.display_name || '—'}</CardTitle>
              <CardDescription>{profile.headline || 'No headline'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <div className="text-sm">{profile.email || '—'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Phone</div>
                  <div className="text-sm">{profile.phone || '—'}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Location</div>
                  <div className="text-sm">{profile.location || '—'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Website</div>
                  <div className="text-sm">{profile.website || '—'}</div>
                </div>
              </div>
              {profile.summary && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Summary</div>
                  <p className="text-sm">{profile.summary}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Experience */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Experience</CardTitle>
              <CardDescription>Work history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.isArray(experiences) && experiences.length ? (
                experiences.map((e: any) => (
                  <div key={e.id} className="p-4 border rounded-md space-y-2">
                    <div className="font-semibold">{e.title || '—'}</div>
                    <div className="font-medium text-sm">{e.company || '—'}</div>
                    {e.location && <div className="text-sm text-muted-foreground">{e.location}</div>}
                    <div className="text-sm text-muted-foreground">
                      {fmtDate(e.start_date)} — {e.is_current ? 'Present' : fmtDate(e.end_date)}
                    </div>
                    {e.description && <p className="mt-2 text-sm whitespace-pre-wrap">{e.description}</p>}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No experience added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Education */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Education</CardTitle>
              <CardDescription>Educational background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.isArray(education) && education.length ? (
                education.map((ed: any) => (
                  <div key={ed.id} className="p-4 border rounded-md space-y-2">
                    <div className="font-semibold">{ed.school || '—'}</div>
                    <div className="text-sm">{ed.degree || ''}{ed.field_of_study ? ` in ${ed.field_of_study}` : ''}</div>
                    <div className="text-sm text-muted-foreground">
                      {ed.start_year || ''} - {ed.end_year || ''}
                    </div>
                    {ed.description && <p className="mt-2 text-sm">{ed.description}</p>}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No education added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>Technical and professional skills</CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(skills) && skills.length ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s: any) => (
                    <span key={s.id || s.skill} className="px-3 py-1 rounded-md bg-slate-100 text-sm text-slate-800">
                      {s.skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No skills added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Certifications & Qualifications */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Certifications & Qualifications</CardTitle>
              <CardDescription>Professional certifications and licenses</CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(certifications) && certifications.length ? (
                <div className="space-y-4">
                  {certifications.map((cert: any, idx: number) => (
                    <div key={cert.id || idx} className="border-b pb-3 last:border-0">
                      <div className="font-semibold">{cert.name || '—'}</div>
                      {cert.authority && <div className="text-sm text-muted-foreground">{cert.authority}</div>}
                      <div className="text-sm text-muted-foreground mt-1">
                        {cert.issued_date && `Issued: ${new Date(cert.issued_date).toLocaleDateString()}`}
                        {cert.expiry_date && ` • Expires: ${new Date(cert.expiry_date).toLocaleDateString()}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No certifications added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Professional Memberships */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Professional Memberships</CardTitle>
              <CardDescription>Professional organizations and memberships</CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(memberships) && memberships.length ? (
                <div className="space-y-4">
                  {memberships.map((mem: any, idx: number) => (
                    <div key={mem.id || idx} className="border-b pb-3 last:border-0">
                      <div className="font-semibold">{mem.name || '—'}</div>
                      {mem.raw_json?.role && <div className="text-sm">{mem.raw_json.role}</div>}
                      <div className="text-sm text-muted-foreground mt-1">
                        {mem.issued_date && new Date(mem.issued_date).toLocaleDateString()}
                        {' - '}
                        {mem.raw_json?.is_current ? 'Present' : (mem.expiry_date ? new Date(mem.expiry_date).toLocaleDateString() : '')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No memberships added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Voluntary & Governance Roles */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Voluntary & Governance Roles</CardTitle>
              <CardDescription>Board positions, volunteer work, and community involvement</CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(voluntary) && voluntary.length ? (
                <div className="space-y-4">
                  {voluntary.map((vol: any, idx: number) => (
                    <div key={vol.id || idx} className="border-b pb-3 last:border-0">
                      <div className="font-semibold">{vol.name || '—'}</div>
                      {vol.raw_json?.role && <div className="text-sm">{vol.raw_json.role}</div>}
                      <div className="text-sm text-muted-foreground mt-1">
                        {vol.issued_date && new Date(vol.issued_date).toLocaleDateString()}
                        {' - '}
                        {vol.raw_json?.is_current ? 'Present' : (vol.expiry_date ? new Date(vol.expiry_date).toLocaleDateString() : '')}
                      </div>
                      {vol.raw_json?.description && <p className="mt-2 text-sm">{vol.raw_json.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No voluntary roles added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manage your profile and generate CV</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button variant="default" asChild>
                  <Link href="/profile/manual">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              </div>
              
              <GenerateCVButton profileId={profileId} />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } catch (err) {
    console.error('Error rendering profile CV', err)
    return <div className="p-6">Error loading CV.</div>
  }
}

export const runtime = 'nodejs'
