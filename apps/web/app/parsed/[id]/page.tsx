// This page intentionally runs on the client so it can access the browser's
// Supabase session (auth stored in cookies/localStorage). Server-side rendering
// attempted to read a session on the server and produced "Missing session token" errors
// because the server doesn't have access to the user's client session.
"use client"

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'
import { ArrowLeft, Upload, Home } from 'lucide-react'
import ProcessParsedClient from './ProcessParsedClient'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'

export default function ParsedPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string | undefined
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [doc, setDoc] = useState<any | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [experiences, setExperiences] = useState<any[]>([])
  const [education, setEducation] = useState<any[]>([])
  const [skills, setSkills] = useState<any[]>([])
  const [certifications, setCertifications] = useState<any[]>([])
  const [memberships, setMemberships] = useState<any[]>([])
  const [voluntaryRoles, setVoluntaryRoles] = useState<any[]>([])
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!id) {
        setError('Missing document id')
        setLoading(false)
        return
      }
      try {
        const { data: authData, error: authErr } = await supabaseClient.auth.getUser()
        if (authErr || !authData || !authData.user) {
          setError('Unauthorized. Please sign in.')
          setLoading(false)
          return
        }
        const usr = authData.user
        setUser(usr)
        // expose the supabase client to the browser console for debugging
        try {
          ;(window as any).__supabase = supabaseClient
          console.log('Supabase client exposed to window.__supabase for debugging')
        } catch (e) {
          // ignore in non-browser contexts
        }

        // fetch parsed document (defensive: catch thrown errors and log env presence)
        let docs: any = null
        let dErr: any = null
        try {
          const res = await supabaseClient.from('parsed_documents').select('*').eq('id', id).limit(1)
          docs = (res as any).data
          dErr = (res as any).error
        } catch (fetchErr) {
          console.error('Supabase client threw when fetching parsed document', fetchErr, { id, supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL })
          setError('Error loading parsed document.')
          setLoading(false)
          return
        }
        if (dErr) {
          // Log richer context to help diagnose empty/opaque error objects
          try {
            console.error('Error fetching parsed document', dErr, { docs, id, supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL })
          } catch (logErr) {
            console.error('Error fetching parsed document (failed to stringify context)', dErr, logErr)
          }
          setError('Error loading parsed document.')
          setLoading(false)
          return
        }
        if (!docs || docs.length === 0) {
          setError('Parsed document not found.')
          setLoading(false)
          return
        }
        const docRow = docs[0]

        // check owner or admin
        let isAllowed = false
        if (docRow.user_id === usr.id) isAllowed = true
        else {
          const { data: profiles, error: pErr } = await supabaseClient.from('profiles').select('is_admin').eq('user_id', usr.id).limit(1)
          if (!pErr && profiles && profiles.length && profiles[0] && profiles[0].is_admin) isAllowed = true
        }
        if (!isAllowed) {
          setError('Forbidden. You do not have access to this document.')
          setLoading(false)
          return
        }

        setDoc(docRow)

        // load normalized rows if profile_id set
        if (docRow.profile_id) {
          const [profileRes, expRes, edRes, skRes, certRes, memRes, volRes] = await Promise.all([
            supabaseClient.from('profiles').select('*').eq('id', docRow.profile_id).single(),
            supabaseClient.from('experiences').select('*').eq('profile_id', docRow.profile_id).order('order_index', { ascending: true }),
            supabaseClient.from('education').select('*').eq('profile_id', docRow.profile_id).order('start_year', { ascending: false }),
            supabaseClient.from('skills').select('*').eq('profile_id', docRow.profile_id),
            supabaseClient.from('certifications').select('*').eq('profile_id', docRow.profile_id),
            supabaseClient.from('organizations').select('*').eq('profile_id', docRow.profile_id).eq('raw_json->>type', 'membership'),
            supabaseClient.from('organizations').select('*').eq('profile_id', docRow.profile_id).eq('raw_json->>type', 'voluntary'),
          ])
          setProfile(profileRes.data || null)
          setExperiences(expRes.data || [])
          setEducation(edRes.data || [])
          setSkills(skRes.data || [])
          setCertifications(certRes.data || [])
          setMemberships(memRes.data || [])
          setVoluntaryRoles(volRes.data || [])
        }

        setLoading(false)
      } catch (e) {
        console.error('ParsedPage load error', e)
        if (mounted) {
          setError('Unexpected error loading page')
          setLoading(false)
        }
      }
    }
    load()
    return () => { mounted = false }
  }, [id])

  if (loading) return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }}
    >
      <div className="text-xl" style={{ color: '#FFFFFF' }}>Loading...</div>
    </div>
  )
  if (error) return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }}
    >
      <div className="text-xl" style={{ color: '#ff6b6b' }}>{error}</div>
    </div>
  )
  if (!doc) return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }}
    >
      <div className="text-xl" style={{ color: '#9AA4B2' }}>Parsed document not found.</div>
    </div>
  )

  const parsed = doc.parsed_json || {}
  const llm = parsed.llm || null
  const extracted = parsed.extracted || null

  // Debug logging
  console.log('Parsed document data:', {
    hasLlm: !!llm,
    llmKeys: llm ? Object.keys(llm) : [],
    experiencesCount: llm?.experiences?.length || 0,
    educationCount: llm?.education?.length || 0,
    skillsCount: llm?.skills?.length || 0
  })

  // Use normalized data if available, fallback to parsed JSON if not
  const skillList = skills && skills.length ? skills : (llm && Array.isArray(llm.skills) ? llm.skills : [])
  const experiencesList = experiences && experiences.length ? experiences : (llm && Array.isArray(llm.experiences) ? llm.experiences : [])
  const educationList = education && education.length ? education : (llm && Array.isArray(llm.education) ? llm.education : [])

  const fmtDate = (d: string | undefined | null) => {
    try {
      if (!d) return ''
      const dt = new Date(d)
      return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short' }).format(dt)
    } catch (e) {
      return String(d)
    }
  }

  const name = (llm && llm.name) || (extracted && extracted.name) || doc.user_display_name || '—'
  const email = (llm && llm.email) || (extracted && extracted.email) || '—'
  const phone = (llm && llm.phone) || (extracted && extracted.phone) || '—'

  const jsonString = JSON.stringify(parsed || { parsed_at: doc.parsed_at }, null, 2)
  const jsonDataHref = `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`

  // client will link to admin download endpoint which validates server-side
  const resumeHref = `/api/admin/download-parsed/${doc.id}`

  return (
    <div
      className="min-h-screen p-6"
      style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex gap-3 items-center mb-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF'
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <Link
            href="/profile/upload"
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF'
            }}
          >
            <Upload className="w-4 h-4" />
            Upload Another CV
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#9AA4B2'
            }}
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>

        {/* Normalized Profile Preview */}
        {profile && user && (
          <ProfileEditForm
            user={user}
            profileId={profile.id}
            initialProfile={profile}
            initialExperiences={experiences}
            initialEducation={education}
            initialSkills={skills}
            initialCertifications={certifications}
            initialMemberships={memberships}
            initialVoluntaryRoles={voluntaryRoles}
            onSave={() => {
              // Optionally reload data after save
            }}
          />
        )}

        {/* Raw/Metadata and controls */}
        <div
          className="p-8"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '24px'
          }}
        >
          <h3 className="text-lg font-semibold mb-3" style={{ color: '#4ff1e3' }}>Raw / Metadata</h3>
          <div className="text-sm mb-3" style={{ color: '#9AA4B2' }}>
            Parsed at: {doc.parsed_at || parsed.parsed_at || '—'}
          </div>
          <div className="mb-6">
            <details>
              <summary className="cursor-pointer text-sm font-medium" style={{ color: '#FFFFFF' }}>
                LLM validation & parsed JSON
              </summary>
              <pre
                className="mt-3 max-h-96 overflow-auto text-xs p-4 rounded-xl"
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#E5E7EB'
                }}
              >
                {JSON.stringify(parsed, null, 2)}
              </pre>
            </details>
          </div>

          <div className="flex gap-3">
            <a
              href={resumeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                color: '#FFFFFF',
                boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)',
                textDecoration: 'none'
              }}
            >
              Download Resume
            </a>
            <a
              href={jsonDataHref}
              download={`parsed-${doc.id}.json`}
              className="px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                textDecoration: 'none'
              }}
            >
              Download JSON
            </a>
          </div>
        </div>
        {/* Client-side control to save parsed data into normalized rows */}
        <ProcessParsedClient parsed={parsed} docId={doc.id} />
      </div>
    </div>
  )
}
