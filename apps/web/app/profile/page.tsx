"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [experiences, setExperiences] = useState<any[]>([])
  const [education, setEducation] = useState<any[]>([])
  const [skills, setSkills] = useState<any[]>([])
  const [certifications, setCertifications] = useState<any[]>([])
  const [memberships, setMemberships] = useState<any[]>([])
  const [voluntary, setVoluntary] = useState<any[]>([])

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: authData } = await supabaseClient.auth.getUser()
        if (!authData?.user) {
          router.push('/login')
          return
        }

        // Get user's profile
        const { data: profiles } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .limit(1)

        if (!profiles || profiles.length === 0) {
          // No profile exists, redirect to create
          router.push('/profile/choose')
          return
        }

        const userProfile = profiles[0]
        setProfile(userProfile)

        // Load related data
        const [expRes, eduRes, skillRes, certRes, memRes, volRes] = await Promise.all([
          supabaseClient.from('experiences').select('*').eq('profile_id', userProfile.id).order('order_index', { ascending: true }),
          supabaseClient.from('education').select('*').eq('profile_id', userProfile.id).order('start_year', { ascending: false }),
          supabaseClient.from('skills').select('*').eq('profile_id', userProfile.id),
          supabaseClient.from('certifications').select('*').eq('profile_id', userProfile.id).order('issued_date', { ascending: false }),
          supabaseClient.from('organizations').select('*').eq('profile_id', userProfile.id).eq('raw_json->>type', 'membership').order('issued_date', { ascending: false }),
          supabaseClient.from('organizations').select('*').eq('profile_id', userProfile.id).eq('raw_json->>type', 'voluntary').order('issued_date', { ascending: false })
        ])

        setExperiences(expRes.data || [])
        setEducation(eduRes.data || [])
        setSkills(skillRes.data || [])
        setCertifications(certRes.data || [])
        setMemberships(memRes.data || [])
        setVoluntary(volRes.data || [])
        setLoading(false)
      } catch (error) {
        console.error('Error loading profile:', error)
        setLoading(false)
      }
    }
    loadProfile()
  }, [router])

  const fmtDate = (d: string | undefined | null) => {
    try {
      if (!d) return ''
      const dt = new Date(d)
      return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short' }).format(dt)
    } catch (e) {
      return String(d)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-pink-400 text-lg">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
          <p className="mb-4 text-white">No profile found</p>
          <Button asChild className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:scale-105 transition-transform">
            <Link href="/profile/choose">Create Profile</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Bar */}
        <div className="mb-6 flex gap-2 items-center flex-wrap">
          <Button variant="outline" size="sm" asChild className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:scale-105 transition-transform">
            <Link href="/profile/manual" className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit Profile
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30">
            <Link href="/media" className="flex items-center gap-2">
              Media Library
            </Link>
          </Button>
        </div>

        {/* Personal Details */}
        <Card className="mb-6 bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-white">{profile.full_name || '—'}</CardTitle>
            <CardDescription className="text-purple-200">{profile.headline || 'No headline'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-purple-300">Email</div>
                <div className="text-sm text-white">{profile.email || '—'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-purple-300">Phone</div>
                <div className="text-sm text-white">{profile.phone || '—'}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-purple-300">Location</div>
                <div className="text-sm text-white">{profile.location || '—'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-purple-300">Website</div>
                <div className="text-sm text-white">{profile.website || '—'}</div>
              </div>
            </div>
            {profile.summary && (
              <div>
                <div className="text-sm font-medium text-purple-300 mb-1">Summary</div>
                <p className="text-sm text-white">{profile.summary}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Experience */}
        <Card className="mb-6 bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-white">Experience</CardTitle>
            <CardDescription className="text-purple-200">Work history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {experiences.length > 0 ? (
              experiences.map((exp: any) => (
                <div key={exp.id} className="p-4 border border-white/10 bg-white/5 rounded-xl space-y-2">
                  <div className="font-semibold text-white">{exp.title || '—'}</div>
                  <div className="font-medium text-sm text-purple-200">{exp.company || '—'}</div>
                  {exp.location && <div className="text-sm text-purple-300">{exp.location}</div>}
                  <div className="text-sm text-purple-300">
                    {fmtDate(exp.start_date)} — {exp.is_current ? 'Present' : fmtDate(exp.end_date)}
                  </div>
                  {exp.description && <p className="mt-2 text-sm whitespace-pre-wrap text-purple-100">{exp.description}</p>}
                </div>
              ))
            ) : (
              <p className="text-sm text-purple-300">No experience added yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Education */}
        <Card className="mb-6 bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-white">Education</CardTitle>
            <CardDescription className="text-purple-200">Educational background</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {education.length > 0 ? (
              education.map((edu: any) => (
                <div key={edu.id} className="p-4 border border-white/10 bg-white/5 rounded-xl space-y-2">
                  <div className="font-semibold text-white">{edu.school || '—'}</div>
                  <div className="text-sm text-purple-200">{edu.degree || ''}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}</div>
                  <div className="text-sm text-purple-300">
                    {edu.start_year || ''} - {edu.end_year || ''}
                  </div>
                  {edu.description && <p className="mt-2 text-sm text-purple-100">{edu.description}</p>}
                </div>
              ))
            ) : (
              <p className="text-sm text-purple-300">No education added yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="mb-6 bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-white">Skills</CardTitle>
            <CardDescription className="text-purple-200">Technical and professional skills</CardDescription>
          </CardHeader>
          <CardContent>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: any) => (
                  <span key={skill.id} className="px-3 py-1 rounded-full bg-pink-500/20 text-sm text-pink-300 border border-pink-400/30">
                    {skill.skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-purple-300">No skills added yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Certifications & Qualifications */}
        <Card className="mb-6 bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-white">Certifications & Qualifications</CardTitle>
            <CardDescription className="text-purple-200">Professional certifications and licenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {certifications.length > 0 ? (
              certifications.map((cert: any) => (
                <div key={cert.id} className="p-4 border border-white/10 bg-white/5 rounded-xl space-y-2">
                  <div className="font-semibold text-white">{cert.name || '—'}</div>
                  {cert.authority && <div className="text-sm text-purple-300">{cert.authority}</div>}
                  <div className="text-sm text-purple-300">
                    {cert.issued_date && `Issued: ${new Date(cert.issued_date).toLocaleDateString()}`}
                    {cert.expiry_date && ` • Expires: ${new Date(cert.expiry_date).toLocaleDateString()}`}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-purple-300">No certifications added yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Professional Memberships */}
        <Card className="mb-6 bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-white">Professional Memberships</CardTitle>
            <CardDescription className="text-purple-200">Professional organizations and memberships</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {memberships.length > 0 ? (
              memberships.map((mem: any) => (
                <div key={mem.id} className="p-4 border border-white/10 bg-white/5 rounded-xl space-y-2">
                  <div className="font-semibold text-white">{mem.name || '—'}</div>
                  {mem.raw_json?.role && <div className="text-sm text-purple-200">{mem.raw_json.role}</div>}
                  <div className="text-sm text-purple-300">
                    {mem.issued_date && new Date(mem.issued_date).toLocaleDateString()}
                    {' - '}
                    {mem.raw_json?.is_current ? 'Present' : (mem.expiry_date ? new Date(mem.expiry_date).toLocaleDateString() : '')}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-purple-300">No memberships added yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Voluntary & Governance Roles */}
        <Card className="mb-6 bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardHeader>
            <CardTitle className="text-white">Voluntary & Governance Roles</CardTitle>
            <CardDescription className="text-purple-200">Board positions, volunteer work, and community involvement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {voluntary.length > 0 ? (
              voluntary.map((vol: any) => (
                <div key={vol.id} className="p-4 border border-white/10 bg-white/5 rounded-xl space-y-2">
                  <div className="font-semibold text-white">{vol.name || '—'}</div>
                  {vol.raw_json?.role && <div className="text-sm text-purple-200">{vol.raw_json.role}</div>}
                  <div className="text-sm text-purple-300">
                    {vol.issued_date && new Date(vol.issued_date).toLocaleDateString()}
                    {' - '}
                    {vol.raw_json?.is_current ? 'Present' : (vol.expiry_date ? new Date(vol.expiry_date).toLocaleDateString() : '')}
                  </div>
                  {vol.raw_json?.description && <p className="mt-2 text-sm text-purple-100">{vol.raw_json.description}</p>}
                </div>
              ))
            ) : (
              <p className="text-sm text-purple-300">No voluntary roles added yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
