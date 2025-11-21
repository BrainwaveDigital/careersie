"use client"

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'

export default function UploadClient() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0]
    setFile(f || null)
    setResult(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!file) {
      setError('Please choose a file to upload')
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabaseClient.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setError('Not authenticated. Please log in.')
        setLoading(false)
        return
      }

      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/parsing', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || 'Upload failed')
      } else {
        setResult(json)
        // navigate to parsed CV viewer if parsed_document id is returned
        const parsedId = json?.parsed_document?.id
        if (parsedId) {
          // prefer client-side navigation to the parsed view
          router.push(`/parsed/${parsedId}`)
        }
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 16px',
      background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '672px',
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(25px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
        borderRadius: '24px',
        padding: '32px'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#FFFFFF' }}>Upload your CV</h1>
        <p style={{ color: '#9AA4B2', marginBottom: '24px' }}>Upload a PDF/DOC/DOCX and we'll extract profile fields automatically. You can review and edit the results before saving.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div style={{
            border: '2px dashed rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <label htmlFor="cv-file" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#9AA4B2', marginBottom: '8px' }}>Select CV file</label>
            <input
              id="cv-file"
              name="cv-file"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFile}
              style={{
                margin: '0 auto',
                color: '#9AA4B2',
                fontSize: '14px'
              }}
            />
            <p style={{ color: '#6B7280', marginTop: '12px', fontSize: '14px' }}>Choose a file to upload (max size depends on your Supabase storage limits)</p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(255, 60, 60, 0.15)',
              border: '1px solid rgba(255, 60, 60, 0.4)',
              borderRadius: '12px',
              padding: '12px',
              color: '#ff6b6b'
            }}>{error}</div>
          )}
          {result && (
            <div style={{
              background: 'rgba(74, 222, 128, 0.15)',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              borderRadius: '12px',
              padding: '12px'
            }}>
              <div style={{ fontWeight: '500', color: '#4ade80' }}>Upload result</div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                {result?.parsed_document?.id && (
                  <Link href={`/parsed/${result.parsed_document.id}`} style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#9AA4B2'
                  }}>View parsed CV</Link>
                )}
                <Link href="/profile" style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#9AA4B2'
                }}>View Profile</Link>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                color: '#FFFFFF',
                padding: '10px 16px',
                borderRadius: '14px',
                boxShadow: '0 4px 15px rgba(79, 241, 227, 0.3)',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontWeight: '500'
              }}
            >
              {loading ? 'Uploading…' : 'Upload & Parse'}
            </button>
            <Link href="/profile/choose" style={{
              color: '#9AA4B2',
              padding: '10px 16px',
              borderRadius: '14px',
              fontWeight: '500'
            }} className="hover:opacity-80">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
