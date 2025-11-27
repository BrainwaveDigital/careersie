"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter();
  useEffect(() => {
    router.push('/profile/choose');
  }, [router]);
  return null;

  if (!profile) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)'
      }}>
        <div style={{
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(25px)',
          borderRadius: '24px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)'
        }}>
          <p style={{ marginBottom: '16px', color: '#FFFFFF' }}>No profile found</p>
          <Button asChild className="bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:scale-105 transition-transform">
            <Link href="/profile/choose">Create Profile</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)',
      padding: '32px 16px'
    }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
        {/* Navigation Bar */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" asChild style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#9AA4B2'
          }}>
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild style={{
            background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
            borderRadius: '14px',
            boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)'
          }}>
            <Link href="/profile/manual" className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit Profile
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#9AA4B2'
          }}>
            <Link href="/media" className="flex items-center gap-2">
              Media Library
            </Link>
          </Button>
        </div>

        {/* Personal Details */}
        <Card style={{
          marginBottom: '24px',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
          borderRadius: '20px'
        }}>
          <CardHeader>
            <CardTitle style={{ color: '#FFFFFF' }}>{profile.full_name || '—'}</CardTitle>
            <CardDescription style={{ color: '#9AA4B2' }}>{profile.headline || 'No headline'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#9AA4B2', marginBottom: '4px' }}>Email</div>
                <div style={{ fontSize: '14px', color: '#FFFFFF' }}>{profile.email || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#9AA4B2', marginBottom: '4px' }}>Phone</div>
                <div style={{ fontSize: '14px', color: '#FFFFFF' }}>{profile.phone || '—'}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#9AA4B2', marginBottom: '4px' }}>Location</div>
                <div style={{ fontSize: '14px', color: '#FFFFFF' }}>{profile.location || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#9AA4B2', marginBottom: '4px' }}>Website</div>
                <div style={{ fontSize: '14px', color: '#FFFFFF' }}>{profile.website || '—'}</div>
              </div>
            </div>
            {profile.summary && (
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#9AA4B2', marginBottom: '4px' }}>Summary</div>
                <p style={{ fontSize: '14px', color: '#FFFFFF' }}>{profile.summary}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Experience */}
        <Card style={{
          marginBottom: '24px',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
          borderRadius: '20px'
        }}>
          <CardHeader>
            <CardTitle style={{ color: '#FFFFFF' }}>Experience</CardTitle>
            <CardDescription style={{ color: '#9AA4B2' }}>Work history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {experiences.length > 0 ? (
              experiences.map((exp: any) => (
                <div key={exp.id} style={{
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '16px'
                }} className="space-y-2">
                  <div style={{ fontWeight: '600', color: '#FFFFFF' }}>{exp.title || '—'}</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#9AA4B2' }}>{exp.company || '—'}</div>
                  {exp.location && <div style={{ fontSize: '14px', color: '#9AA4B2' }}>{exp.location}</div>}
                  <div style={{ fontSize: '14px', color: '#9AA4B2' }}>
                    {fmtDate(exp.start_date)} — {exp.is_current ? 'Present' : fmtDate(exp.end_date)}
                  </div>
                  {exp.description && <p style={{ marginTop: '8px', fontSize: '14px', whiteSpace: 'pre-wrap', color: '#9AA4B2' }}>{exp.description}</p>}
                </div>
              ))
            ) : (
              <p style={{ fontSize: '14px', color: '#9AA4B2' }}>No experience added yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Education */}
        <Card style={{
          marginBottom: '24px',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
          borderRadius: '20px'
        }}>
          <CardHeader>
            <CardTitle style={{ color: '#FFFFFF' }}>Education</CardTitle>
            <CardDescription style={{ color: '#9AA4B2' }}>Educational background</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {education.length > 0 ? (
              education.map((edu: any) => (
                <div key={edu.id} style={{
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '16px'
                }} className="space-y-2">
                  <div style={{ fontWeight: '600', color: '#FFFFFF' }}>{edu.school || '—'}</div>
                  <div style={{ fontSize: '14px', color: '#9AA4B2' }}>{edu.degree || ''}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}</div>
                  <div style={{ fontSize: '14px', color: '#9AA4B2' }}>
                    {edu.start_year || ''} - {edu.end_year || ''}
                  </div>
                  {edu.description && <p style={{ marginTop: '8px', fontSize: '14px', color: '#9AA4B2' }}>{edu.description}</p>}
                </div>
              ))
            ) : (
              <p style={{ fontSize: '14px', color: '#9AA4B2' }}>No education added yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card style={{
          marginBottom: '24px',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
          borderRadius: '20px'
        }}>
          <CardHeader>
            <CardTitle style={{ color: '#FFFFFF' }}>Skills</CardTitle>
            <CardDescription style={{ color: '#9AA4B2' }}>Technical and professional skills</CardDescription>
          </CardHeader>
          <CardContent>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: any) => (
                  <span key={skill.id} style={{
                    padding: '6px 12px',
                    borderRadius: '12px',
                    background: 'rgba(79, 241, 227, 0.15)',
                    fontSize: '14px',
                    color: '#4ff1e3',
                    border: '1px solid rgba(79, 241, 227, 0.3)'
                  }}>
                    {skill.skill}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#9AA4B2' }}>No skills added yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Certifications & Qualifications */}
        <Card style={{
          marginBottom: '24px',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
          borderRadius: '20px'
        }}>
          <CardHeader>
            <CardTitle style={{ color: '#FFFFFF' }}>Certifications & Qualifications</CardTitle>
            <CardDescription style={{ color: '#9AA4B2' }}>Professional certifications and licenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {certifications.length > 0 ? (
              certifications.map((cert: any) => (
                <div key={cert.id} style={{
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '16px'
                }} className="space-y-2">
                  <div style={{ fontWeight: '600', color: '#FFFFFF' }}>{cert.name || '—'}</div>
                  {cert.authority && <div style={{ fontSize: '14px', color: '#9AA4B2' }}>{cert.authority}</div>}
                  <div style={{ fontSize: '14px', color: '#9AA4B2' }}>
                    {cert.issued_date && `Issued: ${new Date(cert.issued_date).toLocaleDateString()}`}
                    {cert.expiry_date && ` • Expires: ${new Date(cert.expiry_date).toLocaleDateString()}`}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '14px', color: '#9AA4B2' }}>No certifications added yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Professional Memberships */}
        <Card style={{
          marginBottom: '24px',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
          borderRadius: '20px'
        }}>
          <CardHeader>
            <CardTitle style={{ color: '#FFFFFF' }}>Professional Memberships</CardTitle>
            <CardDescription style={{ color: '#9AA4B2' }}>Professional organizations and memberships</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {memberships.length > 0 ? (
              memberships.map((mem: any) => (
                <div key={mem.id} style={{
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '16px'
                }} className="space-y-2">
                  <div style={{ fontWeight: '600', color: '#FFFFFF' }}>{mem.name || '—'}</div>
                  {mem.raw_json?.role && <div style={{ fontSize: '14px', color: '#9AA4B2' }}>{mem.raw_json.role}</div>}
                  <div style={{ fontSize: '14px', color: '#9AA4B2' }}>
                    {mem.issued_date && new Date(mem.issued_date).toLocaleDateString()}
                    {' - '}
                    {mem.raw_json?.is_current ? 'Present' : (mem.expiry_date ? new Date(mem.expiry_date).toLocaleDateString() : '')}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '14px', color: '#9AA4B2' }}>No memberships added yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Voluntary & Governance Roles */}
        <Card style={{
          marginBottom: '24px',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
          borderRadius: '20px'
        }}>
          <CardHeader>
            <CardTitle style={{ color: '#FFFFFF' }}>Voluntary & Governance Roles</CardTitle>
            <CardDescription style={{ color: '#9AA4B2' }}>Board positions, volunteer work, and community involvement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {voluntary.length > 0 ? (
              voluntary.map((vol: any) => (
                <div key={vol.id} style={{
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '16px'
                }} className="space-y-2">
                  <div style={{ fontWeight: '600', color: '#FFFFFF' }}>{vol.name || '—'}</div>
                  {vol.raw_json?.role && <div style={{ fontSize: '14px', color: '#9AA4B2' }}>{vol.raw_json.role}</div>}
                  <div style={{ fontSize: '14px', color: '#9AA4B2' }}>
                    {vol.issued_date && new Date(vol.issued_date).toLocaleDateString()}
                    {' - '}
                    {vol.raw_json?.is_current ? 'Present' : (vol.expiry_date ? new Date(vol.expiry_date).toLocaleDateString() : '')}
                  </div>
                  {vol.raw_json?.description && <p style={{ marginTop: '8px', fontSize: '14px', color: '#9AA4B2' }}>{vol.raw_json.description}</p>}
                </div>
              ))
            ) : (
              <p style={{ fontSize: '14px', color: '#9AA4B2' }}>No voluntary roles added yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
