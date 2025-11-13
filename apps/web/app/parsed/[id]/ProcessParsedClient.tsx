"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import { ingestParsedAsUser } from '@/lib/parsedClient'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
// Import the schema dynamically at runtime to avoid TS module resolution issues in the client bundle
const loadSchema = async () => {
  try {
    const res = await fetch('/scripts/parsed-schema.json')
    return await res.json()
  } catch (e) {
    console.warn('Failed to load parsed schema from /scripts/parsed-schema.json', e)
    return null
  }
}

type Props = {
  parsed: any
  docId?: string
}

export default function ProcessParsedClient({ parsed, docId }: Props) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    supabaseClient.auth.getSession().then((res: any) => {
      if (!mounted) return
      setSession(res?.data?.session ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))

    const { data } = supabaseClient.auth.onAuthStateChange((_event: any, session: any) => {
      if (mounted) setSession(session)
    })

    return () => {
      mounted = false
      try { data?.subscription?.unsubscribe?.() } catch (e) { /* ignore */ }
    }
  }, [])

  // client-side validation of the parsed payload
  const [validationErrors, setValidationErrors] = useState<string[] | null>(null)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const s = await loadSchema()
        if (!mounted || !s) return setValidationErrors(null)
        const ajv = new Ajv({ allErrors: true })
        addFormats(ajv)
        const validate = ajv.compile(s as any)
        const ok = validate(parsed)
        if (!ok) {
          const msgs = (validate.errors || []).map((e: any) => `${e.instancePath || '/'} ${e.message}`)
          setValidationErrors(msgs)
        } else {
          setValidationErrors(null)
        }
      } catch (e) {
        console.warn('Validation failed to run', e)
        setValidationErrors(null)
      }
    })()
    return () => { mounted = false }
  }, [parsed])

  // toast
  const [toast, setToast] = useState<string | null>(null)


  const handleProcessData = async () => {
    if (!session) {
      setMessage('Cannot process: not authenticated')
      return
    }
    setProcessing(true)
    setMessage(null)
    try {
      // Use client-side ingest helper so RLS applies
      const res = await ingestParsedAsUser(parsed)
      setMessage('Ingest succeeded')
      // Optionally navigate to profile CV page if created
      if (res?.profile_id) {
        router.push(`/profile/${res.profile_id}/cv`)
      }
    } catch (err: any) {
      console.error('Process error', err)
      setMessage(err?.message || 'Processing failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div>Checking authentication...</div>

  if (!session) return (
    <div className="p-4 bg-yellow-50 rounded">
      <div className="font-semibold">Access required</div>
      <div className="text-sm">You must be signed in to save parsed data.</div>
      <button className="mt-2 underline text-sm" onClick={() => router.push('/login')}>Sign in</button>
    </div>
  )

  return (
    <div className="p-4">
      <div className="mb-2">Signed in as <strong>{session.user?.email || session.user?.id}</strong></div>
      <button disabled={processing} onClick={handleProcessData} className="px-3 py-2 bg-blue-600 text-white rounded">
        {processing ? 'Processing…' : 'Save parsed data to profile'}
      </button>
      {message && <div className="mt-2 text-sm">{message}</div>}
    </div>
  )
}
