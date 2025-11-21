"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

interface Experience {
  id: string
  title: string
  company: string
  location: string
  start_date: string
  end_date: string
  is_current: boolean
  description: string
}

interface Education {
  id: string
  school: string
  degree: string
  field_of_study: string
  start_year: string
  end_year: string
  description: string
}

interface Skill {
  id: string
  skill: string
}

interface Certification {
  id: string
  name: string
  authority: string
  issued_date: string
  expiry_date: string
}

interface Membership {
  id: string
  name: string
  role: string
  start_date: string
  end_date: string
  is_current: boolean
}

interface VoluntaryRole {
  id: string
  organization: string
  role: string
  start_date: string
  end_date: string
  is_current: boolean
  description: string
}

export default function ProfileManualPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profileId, setProfileId] = useState<string | null>(null)

  // Personal details
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [headline, setHeadline] = useState('')
  const [summary, setSummary] = useState('')

  // Experience list
  const [experiences, setExperiences] = useState<Experience[]>([])

  // Education list
  const [education, setEducation] = useState<Education[]>([])

  // Skills list
  const [skills, setSkills] = useState<Skill[]>([])

  // Certifications list
  const [certifications, setCertifications] = useState<Certification[]>([])

  // Memberships list
  const [memberships, setMemberships] = useState<Membership[]>([])

  // Voluntary roles list
  const [voluntaryRoles, setVoluntaryRoles] = useState<VoluntaryRole[]>([])

  useEffect(() => {
    async function loadUser() {
      const { data: authData } = await supabaseClient.auth.getUser()
      if (!authData?.user) {
        router.push('/login')
        return
      }
      setUser(authData.user)
      setEmail(authData.user.email || '')

      // Check if user already has a profile
      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .limit(1)

      if (profiles && profiles.length > 0) {
        const profile = profiles[0]
        setProfileId(profile.id)
        setFullName(profile.full_name || '')
        setEmail(profile.email || authData.user.email || '')
        setPhone(profile.phone || '')
        setLocation(profile.location || '')
        setWebsite(profile.website || '')
        setHeadline(profile.headline || '')
        setSummary(profile.summary || '')

        // Load existing data
        const [expRes, eduRes, skillRes, certRes, memRes, volRes] = await Promise.all([
          supabaseClient.from('experiences').select('*').eq('profile_id', profile.id).order('order_index', { ascending: true }),
          supabaseClient.from('education').select('*').eq('profile_id', profile.id).order('start_year', { ascending: false }),
          supabaseClient.from('skills').select('*').eq('profile_id', profile.id),
          supabaseClient.from('certifications').select('*').eq('profile_id', profile.id),
          supabaseClient.from('organizations').select('*').eq('profile_id', profile.id).eq('raw_json->>type', 'membership'),
          supabaseClient.from('organizations').select('*').eq('profile_id', profile.id).eq('raw_json->>type', 'voluntary')
        ])

        if (expRes.data) {
          setExperiences(expRes.data.map((e: any) => ({
            id: e.id,
            title: e.title || '',
            company: e.company || '',
            location: e.location || '',
            start_date: e.start_date || '',
            end_date: e.end_date || '',
            is_current: e.is_current || false,
            description: e.description || ''
          })))
        }

        if (eduRes.data) {
          setEducation(eduRes.data.map((e: any) => ({
            id: e.id,
            school: e.school || '',
            degree: e.degree || '',
            field_of_study: e.field_of_study || '',
            start_year: e.start_year?.toString() || '',
            end_year: e.end_year?.toString() || '',
            description: e.description || ''
          })))
        }

        if (skillRes.data) {
          setSkills(skillRes.data.map((s: any) => ({
            id: s.id,
            skill: s.skill || ''
          })))
        }

        if (certRes.data) {
          setCertifications(certRes.data.map((c: any) => ({
            id: c.id,
            name: c.name || '',
            authority: c.authority || '',
            issued_date: c.issued_date || '',
            expiry_date: c.expiry_date || ''
          })))
        }

        if (memRes.data) {
          setMemberships(memRes.data.map((m: any) => {
            const rawJson = m.raw_json || {}
            return {
              id: m.id,
              name: m.name || '',
              role: rawJson.role || '',
              start_date: m.issued_date || '',
              end_date: m.expiry_date || '',
              is_current: rawJson.is_current || false
            }
          }))
        }

        if (volRes.data) {
          setVoluntaryRoles(volRes.data.map((v: any) => {
            const rawJson = v.raw_json || {}
            return {
              id: v.id,
              organization: v.name || '',
              role: rawJson.role || '',
              start_date: v.issued_date || '',
              end_date: v.expiry_date || '',
              is_current: rawJson.is_current || false,
              description: rawJson.description || ''
            }
          }))
        }
      }
    }
    loadUser()
  }, [router])

  const addExperience = () => {
    setExperiences([...experiences, {
      id: `temp-${Date.now()}`,
      title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: ''
    }])
  }

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter(e => e.id !== id))
  }

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setExperiences(experiences.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const addEducation = () => {
    setEducation([...education, {
      id: `temp-${Date.now()}`,
      school: '',
      degree: '',
      field_of_study: '',
      start_year: '',
      end_year: '',
      description: ''
    }])
  }

  const removeEducation = (id: string) => {
    setEducation(education.filter(e => e.id !== id))
  }

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setEducation(education.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const addSkill = () => {
    setSkills([...skills, { id: `temp-${Date.now()}`, skill: '' }])
  }

  const removeSkill = (id: string) => {
    setSkills(skills.filter(s => s.id !== id))
  }

  const updateSkill = (id: string, value: string) => {
    setSkills(skills.map(s => s.id === id ? { ...s, skill: value } : s))
  }

  // Certification handlers
  const addCertification = () => {
    setCertifications([...certifications, {
      id: `temp-${Date.now()}`,
      name: '',
      authority: '',
      issued_date: '',
      expiry_date: ''
    }])
  }

  const removeCertification = (id: string) => {
    setCertifications(certifications.filter(c => c.id !== id))
  }

  const updateCertification = (id: string, field: keyof Certification, value: any) => {
    setCertifications(certifications.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  // Membership handlers
  const addMembership = () => {
    setMemberships([...memberships, {
      id: `temp-${Date.now()}`,
      name: '',
      role: '',
      start_date: '',
      end_date: '',
      is_current: false
    }])
  }

  const removeMembership = (id: string) => {
    setMemberships(memberships.filter(m => m.id !== id))
  }

  const updateMembership = (id: string, field: keyof Membership, value: any) => {
    setMemberships(memberships.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  // Voluntary role handlers
  const addVoluntaryRole = () => {
    setVoluntaryRoles([...voluntaryRoles, {
      id: `temp-${Date.now()}`,
      organization: '',
      role: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: ''
    }])
  }

  const removeVoluntaryRole = (id: string) => {
    setVoluntaryRoles(voluntaryRoles.filter(v => v.id !== id))
  }

  const updateVoluntaryRole = (id: string, field: keyof VoluntaryRole, value: any) => {
    setVoluntaryRoles(voluntaryRoles.map(v => v.id === id ? { ...v, [field]: value } : v))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      let currentProfileId = profileId

      // Create or update profile
      if (!currentProfileId) {
        const { data, error } = await supabaseClient
          .from('profiles')
          .insert({
            user_id: user.id,
            full_name: fullName,
            email,
            phone,
            location,
            website,
            headline,
            summary
          })
          .select()

        if (error) throw error
        currentProfileId = data[0].id
        setProfileId(currentProfileId)
      } else {
        const { error } = await supabaseClient
          .from('profiles')
          .update({
            full_name: fullName,
            email,
            phone,
            location,
            website,
            headline,
            summary,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentProfileId)

        if (error) throw error
      }

      // Delete existing experiences, education, skills and re-insert
      await Promise.all([
        supabaseClient.from('experiences').delete().eq('profile_id', currentProfileId),
        supabaseClient.from('education').delete().eq('profile_id', currentProfileId),
        supabaseClient.from('skills').delete().eq('profile_id', currentProfileId),
        supabaseClient.from('certifications').delete().eq('profile_id', currentProfileId),
        supabaseClient.from('organizations').delete().eq('profile_id', currentProfileId)
      ])

      // Insert experiences
      if (experiences.length > 0) {
        const expData = experiences.map((e, idx) => ({
          profile_id: currentProfileId,
          title: e.title,
          company: e.company,
          location: e.location,
          start_date: e.start_date || null,
          end_date: e.end_date || null,
          is_current: e.is_current,
          description: e.description,
          order_index: idx
        }))
        const { error } = await supabaseClient.from('experiences').insert(expData)
        if (error) throw error
      }

      // Insert education
      if (education.length > 0) {
        const eduData = education.map(e => ({
          profile_id: currentProfileId,
          school: e.school,
          degree: e.degree,
          field_of_study: e.field_of_study,
          start_year: e.start_year ? parseInt(e.start_year) : null,
          end_year: e.end_year ? parseInt(e.end_year) : null,
          description: e.description
        }))
        const { error } = await supabaseClient.from('education').insert(eduData)
        if (error) throw error
      }

      // Insert skills
      if (skills.length > 0) {
        const skillData = skills
          .filter(s => s.skill.trim())
          .map(s => ({
            profile_id: currentProfileId,
            skill: s.skill.trim()
          }))
        if (skillData.length > 0) {
          console.log('🔵 Inserting skills:', { 
            count: skillData.length, 
            profileId: currentProfileId,
            userId: user.id,
            sample: skillData[0]
          })
          
          // Verify profile ownership before insert
          const { data: profileCheck, error: checkError } = await supabaseClient
            .from('profiles')
            .select('id, user_id')
            .eq('id', currentProfileId)
            .single()
          
          console.log('🔍 Profile check:', { profileCheck, checkError })
          
          if (checkError || !profileCheck || profileCheck.user_id !== user.id) {
            throw new Error(`Profile ownership verification failed. Profile user_id: ${profileCheck?.user_id}, Current user: ${user.id}`)
          }
          
          const { error } = await supabaseClient.from('skills').insert(skillData)
          if (error) {
            console.error('❌ Skills insert error:', error)
            throw error
          }
          console.log('✅ Skills inserted successfully')
        }
      }

      // Insert certifications
      if (certifications.length > 0) {
        const certData = certifications
          .filter(c => c.name.trim())
          .map(c => ({
            profile_id: currentProfileId,
            name: c.name.trim(),
            authority: c.authority.trim(),
            issued_date: c.issued_date || null,
            expiry_date: c.expiry_date || null
          }))
        if (certData.length > 0) {
          const { error } = await supabaseClient.from('certifications').insert(certData)
          if (error) throw error
        }
      }

      // Insert memberships
      if (memberships.length > 0) {
        const memData = memberships
          .filter(m => m.name.trim())
          .map(m => ({
            profile_id: currentProfileId,
            name: m.name.trim(),
            issued_date: m.start_date || null,
            expiry_date: m.end_date || null,
            raw_json: {
              type: 'membership',
              role: m.role,
              is_current: m.is_current
            }
          }))
        if (memData.length > 0) {
          const { error } = await supabaseClient.from('organizations').insert(memData)
          if (error) throw error
        }
      }

      // Insert voluntary roles
      if (voluntaryRoles.length > 0) {
        const volData = voluntaryRoles
          .filter(v => v.organization.trim())
          .map(v => ({
            profile_id: currentProfileId,
            name: v.organization.trim(),
            issued_date: v.start_date || null,
            expiry_date: v.end_date || null,
            raw_json: {
              type: 'voluntary',
              role: v.role,
              is_current: v.is_current,
              description: v.description
            }
          }))
        if (volData.length > 0) {
          const { error } = await supabaseClient.from('organizations').insert(volData)
          if (error) throw error
        }
      }

      alert('Profile saved successfully!')
      router.push(`/profile/${currentProfileId}/cv`)
    } catch (error: any) {
      console.error('Error saving profile:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)',
      padding: '32px 16px'
    }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <Button variant="outline" size="sm" asChild style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#9AA4B2'
          }}>
            <Link href="/profile/choose" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Details */}
          <Card style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}>
            <CardHeader>
              <CardTitle style={{ color: '#FFFFFF' }}>Personal Details</CardTitle>
              <CardDescription style={{ color: '#9AA4B2' }}>Basic information about you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="full-name" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#9AA4B2' }}>Full Name *</label>
                <input
                  id="full-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '14px'
                  }}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#9AA4B2' }}>Email *</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '14px'
                    }}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#9AA4B2' }}>Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '14px'
                    }}
                    placeholder="+353 123 456 789"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#9AA4B2' }}>Location</label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '14px'
                    }}
                    placeholder="Dublin, Ireland"
                  />
                </div>
                <div>
                  <label htmlFor="website" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#9AA4B2' }}>Website</label>
                  <input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '14px'
                    }}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="headline" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#9AA4B2' }}>Headline</label>
                <input
                  id="headline"
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '14px'
                  }}
                  placeholder="Senior Software Engineer | React & Node.js Specialist"
                />
              </div>
              <div>
                <label htmlFor="summary" style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#9AA4B2' }}>Summary</label>
                <textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    resize: 'vertical' as const
                  }}
                  placeholder="Brief overview of your professional background and career goals..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Experience */}
          <Card style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle style={{ color: '#FFFFFF' }}>Experience</CardTitle>
                  <CardDescription style={{ color: '#9AA4B2' }}>Your work history</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addExperience} style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#9AA4B2'
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Experience
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {experiences.length === 0 && (
                <p className="text-sm text-muted-foreground">No experience added yet. Click "Add Experience" to begin.</p>
              )}
              {experiences.map((exp, idx) => (
                <div key={exp.id} className="p-4 border rounded-md space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Experience {idx + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExperience(exp.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Job Title *</label>
                      <input
                        type="text"
                        required
                        value={exp.title}
                        onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="Software Engineer"
                        aria-label="Job title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Company *</label>
                      <input
                        type="text"
                        required
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="Acme Corp"
                        aria-label="Company name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input
                      type="text"
                      value={exp.location}
                      onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="Dublin, Ireland"
                      aria-label="Job location"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <input
                        type="date"
                        value={exp.start_date}
                        onChange={(e) => updateExperience(exp.id, 'start_date', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        aria-label="Start date"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <input
                        type="date"
                        value={exp.end_date}
                        onChange={(e) => updateExperience(exp.id, 'end_date', e.target.value)}
                        disabled={exp.is_current}
                        className="w-full px-3 py-2 border rounded-md text-sm disabled:bg-gray-100"
                        aria-label="End date"
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        id={`current-${exp.id}`}
                        checked={exp.is_current}
                        onChange={(e) => updateExperience(exp.id, 'is_current', e.target.checked)}
                        className="mr-2"
                      />
                      I currently work here
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="Describe your responsibilities and achievements..."
                      aria-label="Job description"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Education */}
          <Card style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle style={{ color: '#FFFFFF' }}>Education</CardTitle>
                  <CardDescription style={{ color: '#9AA4B2' }}>Your educational background</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addEducation} style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#9AA4B2'
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Education
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {education.length === 0 && (
                <p style={{ fontSize: '14px', color: '#9AA4B2' }}>No education added yet. Click "Add Education" to begin.</p>
              )}
              {education.map((edu, idx) => (
                <div key={edu.id} className="p-4 border rounded-md space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Education {idx + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEducation(edu.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">School/Institution *</label>
                    <input
                      type="text"
                      required
                      value={edu.school}
                      onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="Trinity College Dublin"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Degree *</label>
                      <input
                        type="text"
                        required
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="Bachelor of Science"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Field of Study</label>
                      <input
                        type="text"
                        value={edu.field_of_study}
                        onChange={(e) => updateEducation(edu.id, 'field_of_study', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="Computer Science"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Year</label>
                      <input
                        type="number"
                        value={edu.start_year}
                        onChange={(e) => updateEducation(edu.id, 'start_year', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="2015"
                        min="1950"
                        max="2099"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Year</label>
                      <input
                        type="number"
                        value={edu.end_year}
                        onChange={(e) => updateEducation(edu.id, 'end_year', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="2019"
                        min="1950"
                        max="2099"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={edu.description}
                      onChange={(e) => updateEducation(edu.id, 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="Additional details, honors, activities..."
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle style={{ color: '#FFFFFF' }}>Skills</CardTitle>
                  <CardDescription style={{ color: '#9AA4B2' }}>Your technical and professional skills</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addSkill} style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#9AA4B2'
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Skill
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {skills.length === 0 && (
                <p style={{ fontSize: '14px', color: '#9AA4B2' }}>No skills added yet. Click "Add Skill" to begin.</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {skills.map((skill) => (
                  <div key={skill.id} className="flex gap-2">
                    <input
                      type="text"
                      value={skill.skill}
                      onChange={(e) => updateSkill(skill.id, e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                      placeholder="e.g., React, Python, Project Management"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSkill(skill.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle style={{ color: '#FFFFFF' }}>Certifications & Qualifications</CardTitle>
                  <CardDescription style={{ color: '#9AA4B2' }}>Professional certifications and qualifications</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addCertification} style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#9AA4B2'
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Certification
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {certifications.length === 0 && (
                <p style={{ fontSize: '14px', color: '#9AA4B2' }}>No certifications added yet. Click "Add Certification" to begin.</p>
              )}
              {certifications.map((cert, idx) => (
                <div key={cert.id} className="p-4 border rounded-md space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Certification {idx + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCertification(cert.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Certification Name *</label>
                      <input
                        type="text"
                        required
                        value={cert.name}
                        onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="AWS Certified Solutions Architect"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Issuing Authority *</label>
                      <input
                        type="text"
                        required
                        value={cert.authority}
                        onChange={(e) => updateCertification(cert.id, 'authority', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="Amazon Web Services"
                        aria-label="Issuing authority"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Issue Date</label>
                      <input
                        type="date"
                        value={cert.issued_date}
                        onChange={(e) => updateCertification(cert.id, 'issued_date', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        aria-label="Issue date"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={cert.expiry_date}
                        onChange={(e) => updateCertification(cert.id, 'expiry_date', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        aria-label="Expiry date"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Memberships */}
          <Card style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle style={{ color: '#FFFFFF' }}>Professional Memberships</CardTitle>
                  <CardDescription style={{ color: '#9AA4B2' }}>Professional organizations and memberships</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addMembership} style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#9AA4B2'
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Membership
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {memberships.length === 0 && (
                <p style={{ fontSize: '14px', color: '#9AA4B2' }}>No memberships added yet. Click "Add Membership" to begin.</p>
              )}
              {memberships.map((mem, idx) => (
                <div key={mem.id} className="p-4 border rounded-md space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Membership {idx + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMembership(mem.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Organization Name *</label>
                      <input
                        type="text"
                        required
                        value={mem.name}
                        onChange={(e) => updateMembership(mem.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="IEEE Computer Society"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Role/Level</label>
                      <input
                        type="text"
                        value={mem.role}
                        onChange={(e) => updateMembership(mem.id, 'role', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="Senior Member"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <input
                        type="date"
                        value={mem.start_date}
                        onChange={(e) => updateMembership(mem.id, 'start_date', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        aria-label="Membership start date"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <input
                        type="date"
                        value={mem.end_date}
                        onChange={(e) => updateMembership(mem.id, 'end_date', e.target.value)}
                        disabled={mem.is_current}
                        className="w-full px-3 py-2 border rounded-md text-sm disabled:bg-gray-100"
                        aria-label="Membership end date"
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={mem.is_current}
                        onChange={(e) => updateMembership(mem.id, 'is_current', e.target.checked)}
                        className="mr-2"
                      />
                      Current membership
                    </label>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Voluntary/Governance Roles */}
          <Card style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '20px'
          }}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle style={{ color: '#FFFFFF' }}>Voluntary & Governance Roles</CardTitle>
                  <CardDescription style={{ color: '#9AA4B2' }}>Voluntary work and governance positions</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addVoluntaryRole} style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#9AA4B2'
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Role
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {voluntaryRoles.length === 0 && (
                <p className="text-sm text-muted-foreground">No voluntary roles added yet. Click "Add Role" to begin.</p>
              )}
              {voluntaryRoles.map((vol, idx) => (
                <div key={vol.id} className="p-4 border rounded-md space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Voluntary Role {idx + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVoluntaryRole(vol.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Organization *</label>
                      <input
                        type="text"
                        required
                        value={vol.organization}
                        onChange={(e) => updateVoluntaryRole(vol.id, 'organization', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="Local Food Bank"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Role *</label>
                      <input
                        type="text"
                        required
                        value={vol.role}
                        onChange={(e) => updateVoluntaryRole(vol.id, 'role', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        placeholder="Volunteer Coordinator"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <input
                        type="date"
                        value={vol.start_date}
                        onChange={(e) => updateVoluntaryRole(vol.id, 'start_date', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md text-sm"
                        aria-label="Role start date"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <input
                        type="date"
                        value={vol.end_date}
                        onChange={(e) => updateVoluntaryRole(vol.id, 'end_date', e.target.value)}
                        disabled={vol.is_current}
                        className="w-full px-3 py-2 border rounded-md text-sm disabled:bg-gray-100"
                        aria-label="Role end date"
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={vol.is_current}
                        onChange={(e) => updateVoluntaryRole(vol.id, 'is_current', e.target.checked)}
                        className="mr-2"
                      />
                      Currently active
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={vol.description}
                      onChange={(e) => updateVoluntaryRole(vol.id, 'description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="Describe your responsibilities and impact..."
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" asChild style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#9AA4B2'
            }}>
              <Link href="/profile/choose">Cancel</Link>
            </Button>
            <Button type="submit" disabled={loading} style={{
              background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
              borderRadius: '14px',
              boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)',
              color: '#FFFFFF',
              opacity: loading ? 0.5 : 1
            }}>
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
