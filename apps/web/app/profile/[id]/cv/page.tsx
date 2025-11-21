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
      <div
        className="min-h-screen py-8 px-4"
        style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Navigation Bar */}
          <div className="mb-6 flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#9AA4B2'
              }}
            >
              <Link href="/dashboard" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button
              variant="default"
              size="sm"
              asChild
              className="transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                borderRadius: '12px',
                color: '#FFFFFF',
                boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)',
                border: 'none'
              }}
            >
              <Link href="/profile/manual" className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Profile
              </Link>
            </Button>
          </div>

          {/* Personal Details */}
          <Card
            className="mb-6"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
              borderRadius: '20px'
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: '#FFFFFF' }}>{profile.full_name || profile.display_name || '—'}</CardTitle>
              <CardDescription style={{ color: '#9AA4B2' }}>{profile.headline || 'No headline'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium" style={{ color: '#9AA4B2' }}>Email</div>
                  <div className="text-sm" style={{ color: '#E5E7EB' }}>{profile.email || '—'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: '#9AA4B2' }}>Phone</div>
                  <div className="text-sm" style={{ color: '#E5E7EB' }}>{profile.phone || '—'}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium" style={{ color: '#9AA4B2' }}>Location</div>
                  <div className="text-sm" style={{ color: '#E5E7EB' }}>{profile.location || '—'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: '#9AA4B2' }}>Website</div>
                  <div className="text-sm" style={{ color: '#E5E7EB' }}>{profile.website || '—'}</div>
                </div>
              </div>
              {profile.summary && (
                <div>
                  <div className="text-sm font-medium mb-1" style={{ color: '#9AA4B2' }}>Summary</div>
                  <p className="text-sm" style={{ color: '#E5E7EB' }}>{profile.summary}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Experience */}
          <Card
            className="mb-6"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
              borderRadius: '20px'
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: '#FFFFFF' }}>Experience</CardTitle>
              <CardDescription style={{ color: '#9AA4B2' }}>Work history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.isArray(experiences) && experiences.length ? (
                experiences.map((e: any) => (
                  <div
                    key={e.id}
                    className="p-4 rounded-md space-y-2"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <div className="font-semibold" style={{ color: '#FFFFFF' }}>{e.title || '—'}</div>
                    <div className="font-medium text-sm" style={{ color: '#E5E7EB' }}>{e.company || '—'}</div>
                    {e.location && <div className="text-sm" style={{ color: '#9AA4B2' }}>{e.location}</div>}
                    <div className="text-sm" style={{ color: '#9AA4B2' }}>
                      {fmtDate(e.start_date)} — {e.is_current ? 'Present' : fmtDate(e.end_date)}
                    </div>
                    {e.description && <p className="mt-2 text-sm whitespace-pre-wrap" style={{ color: '#E5E7EB' }}>{e.description}</p>}
                  </div>
                ))
              ) : (
                <p className="text-sm" style={{ color: '#9AA4B2' }}>No experience added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Education */}
          <Card
            className="mb-6"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
              borderRadius: '20px'
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: '#FFFFFF' }}>Education</CardTitle>
              <CardDescription style={{ color: '#9AA4B2' }}>Educational background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.isArray(education) && education.length ? (
                education.map((ed: any) => (
                  <div
                    key={ed.id}
                    className="p-4 rounded-md space-y-2"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <div className="font-semibold" style={{ color: '#FFFFFF' }}>{ed.school || '—'}</div>
                    <div className="text-sm" style={{ color: '#E5E7EB' }}>{ed.degree || ''}{ed.field_of_study ? ` in ${ed.field_of_study}` : ''}</div>
                    <div className="text-sm" style={{ color: '#9AA4B2' }}>
                      {ed.start_year || ''} - {ed.end_year || ''}
                    </div>
                    {ed.description && <p className="mt-2 text-sm" style={{ color: '#E5E7EB' }}>{ed.description}</p>}
                  </div>
                ))
              ) : (
                <p className="text-sm" style={{ color: '#9AA4B2' }}>No education added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card
            className="mb-6"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
              borderRadius: '20px'
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: '#FFFFFF' }}>Skills</CardTitle>
              <CardDescription style={{ color: '#9AA4B2' }}>Technical and professional skills</CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(skills) && skills.length ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s: any) => (
                    <span
                      key={s.id || s.skill}
                      className="px-3 py-1 rounded-md text-sm"
                      style={{
                        background: 'rgba(79, 241, 227, 0.15)',
                        border: '1px solid rgba(79, 241, 227, 0.3)',
                        color: '#4ff1e3'
                      }}
                    >
                      {s.skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#9AA4B2' }}>No skills added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Certifications & Qualifications */}
          <Card
            className="mb-6"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
              borderRadius: '20px'
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: '#FFFFFF' }}>Certifications & Qualifications</CardTitle>
              <CardDescription style={{ color: '#9AA4B2' }}>Professional certifications and licenses</CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(certifications) && certifications.length ? (
                <div className="space-y-4">
                  {certifications.map((cert: any, idx: number) => (
                    <div
                      key={cert.id || idx}
                      className="pb-3 last:border-0"
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
                    >
                      <div className="font-semibold" style={{ color: '#FFFFFF' }}>{cert.name || '—'}</div>
                      {cert.authority && <div className="text-sm" style={{ color: '#9AA4B2' }}>{cert.authority}</div>}
                      <div className="text-sm mt-1" style={{ color: '#9AA4B2' }}>
                        {cert.issued_date && `Issued: ${new Date(cert.issued_date).toLocaleDateString()}`}
                        {cert.expiry_date && ` • Expires: ${new Date(cert.expiry_date).toLocaleDateString()}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#9AA4B2' }}>No certifications added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Professional Memberships */}
          <Card
            className="mb-6"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
              borderRadius: '20px'
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: '#FFFFFF' }}>Professional Memberships</CardTitle>
              <CardDescription style={{ color: '#9AA4B2' }}>Professional organizations and memberships</CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(memberships) && memberships.length ? (
                <div className="space-y-4">
                  {memberships.map((mem: any, idx: number) => (
                    <div
                      key={mem.id || idx}
                      className="pb-3 last:border-0"
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
                    >
                      <div className="font-semibold" style={{ color: '#FFFFFF' }}>{mem.name || '—'}</div>
                      {mem.raw_json?.role && <div className="text-sm" style={{ color: '#E5E7EB' }}>{mem.raw_json.role}</div>}
                      <div className="text-sm mt-1" style={{ color: '#9AA4B2' }}>
                        {mem.issued_date && new Date(mem.issued_date).toLocaleDateString()}
                        {' - '}
                        {mem.raw_json?.is_current ? 'Present' : (mem.expiry_date ? new Date(mem.expiry_date).toLocaleDateString() : '')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#9AA4B2' }}>No memberships added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Voluntary & Governance Roles */}
          <Card
            className="mb-6"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
              borderRadius: '20px'
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: '#FFFFFF' }}>Voluntary & Governance Roles</CardTitle>
              <CardDescription style={{ color: '#9AA4B2' }}>Board positions, volunteer work, and community involvement</CardDescription>
            </CardHeader>
            <CardContent>
              {Array.isArray(voluntary) && voluntary.length ? (
                <div className="space-y-4">
                  {voluntary.map((vol: any, idx: number) => (
                    <div
                      key={vol.id || idx}
                      className="pb-3 last:border-0"
                      style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
                    >
                      <div className="font-semibold" style={{ color: '#FFFFFF' }}>{vol.name || '—'}</div>
                      {vol.raw_json?.role && <div className="text-sm" style={{ color: '#E5E7EB' }}>{vol.raw_json.role}</div>}
                      <div className="text-sm mt-1" style={{ color: '#9AA4B2' }}>
                        {vol.issued_date && new Date(vol.issued_date).toLocaleDateString()}
                        {' - '}
                        {vol.raw_json?.is_current ? 'Present' : (vol.expiry_date ? new Date(vol.expiry_date).toLocaleDateString() : '')}
                      </div>
                      {vol.raw_json?.description && <p className="mt-2 text-sm" style={{ color: '#E5E7EB' }}>{vol.raw_json.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: '#9AA4B2' }}>No voluntary roles added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(25px)',
              boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
              borderRadius: '20px'
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: '#FFFFFF' }}>Actions</CardTitle>
              <CardDescription style={{ color: '#9AA4B2' }}>Manage your profile and generate CV</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  variant="default"
                  asChild
                  style={{
                    background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)',
                    border: 'none'
                  }}
                >
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
