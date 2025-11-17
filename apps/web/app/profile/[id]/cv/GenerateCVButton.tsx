"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Download, Loader2 } from 'lucide-react'

interface GenerateCVButtonProps {
  profileId: string
}

export default function GenerateCVButton({ profileId }: GenerateCVButtonProps) {
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [cvHtml, setCvHtml] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate CV')
      }

      if (data.html) {
        setCvHtml(data.html)
        setGenerated(true)
      } else {
        setError('CV generation failed')
      }
    } catch (err: any) {
      console.error('Error generating CV:', err)
      setError(err.message || 'Failed to generate CV')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!cvHtml) return

    const blob = new Blob([cvHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cv-${profileId.slice(0, 8)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePreview = () => {
    if (!cvHtml) return
    
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(cvHtml)
      newWindow.document.close()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Button 
          variant="secondary" 
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Generate CV
            </>
          )}
        </Button>
        
        {generated && (
          <>
            <Button variant="default" onClick={handlePreview}>
              <FileText className="w-4 h-4 mr-2" />
              Preview CV
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download HTML
            </Button>
          </>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      {generated && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
          ✓ CV generated successfully! Click "Preview CV" to view or "Download HTML" to save.
        </div>
      )}
    </div>
  )
}
