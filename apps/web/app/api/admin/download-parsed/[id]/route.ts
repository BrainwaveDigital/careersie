import { NextResponse } from 'next/server'
import { getSupabaseServerWithAuth } from '@/lib/supabase.server'
import { error } from 'ajv/dist/vocabularies/applicator/dependencies'

// cSpell:ignore apikey

import { NextRequest } from 'next/server'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    // Try Authorization header first, then fall back to cookies (for browser sessions)
    let token: string | null = null
    const auth = req.headers.get('authorization')
    if (auth && auth.startsWith('Bearer ')) {
      token = auth.split(' ')[1] ?? null
    } else {
      const cookieHeader = req.headers.get('cookie') || ''
      const cookieNames = ['sb:token', 'sb-access-token', 'sb-session', 'supabase-auth-token', 'sb:session', 'access_token']
      const cookies = cookieHeader.split(';').map(c => c.trim())
      for (const name of cookieNames) {
        const match = cookies.find(c => c.startsWith(name + '='))
        if (!match) continue
        const raw = match.split('=')[1] ?? ''
        try {
          const parsed = JSON.parse(decodeURIComponent(raw))
          if (parsed && parsed.access_token) {
            token = parsed.access_token
            break
          }
        } catch (e) {
          token = decodeURIComponent(raw)
          break
        }
      }
    }
    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Missing Authorization or session cookie' }), { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) return new NextResponse(JSON.stringify({ error: 'SUPABASE URL not configured' }), { status: 500 })

    // validate token
    const userRes = await fetch(new URL('/auth/v1/user', supabaseUrl).toString(), {
      headers: { Authorization: `Bearer ${token}`, apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' }
    })
    if (!userRes.ok) return new NextResponse(JSON.stringify({ error: 'Invalid token' }), { status: 401 })
    const user = await userRes.json()
    const userId = user?.id
    if (!userId) return new NextResponse(JSON.stringify({ error: 'Unable to determine user id' }), { status: 401 })

    // id is already extracted above
    const sb = await getSupabaseServerWithAuth()
    const { data: docs, error: dErr } = await sb
      .from('parsed_documents')
      .select('id, storage_path')
      .eq('id', id)
      .limit(1) as unknown as { data: import('@/types/supabase').Database['public']['Tables']['parsed_documents']['Row'][]; error: any };

    if (dErr) return new NextResponse(JSON.stringify({ error: 'Failed to fetch parsed document', details: dErr }), { status: 500 })
    if (!docs || docs.length === 0) return new NextResponse(JSON.stringify({ error: 'Parsed document not found' }), { status: 404 })
  const doc = docs && docs.length ? docs[0] : null
  if (!doc) return new NextResponse(JSON.stringify({ error: 'Parsed document not found' }), { status: 404 })

  // storage_path format is 'resumes/...' (bucket/path)
  const parts = (doc.storage_path || '').split('/')
    const bucket = parts.shift()
    const path = parts.join('/')
    if (!bucket || !path) return new NextResponse(JSON.stringify({ error: 'Invalid storage_path' }), { status: 500 })

    const urlObj = new URL(req.url)
    const wantJson = urlObj.searchParams.get('json') === '1'

    if (wantJson) {
      // return parsed JSON for the document (server-side protected)
      const { data: fullDocs, error: fErr } = await sb.from('parsed_documents').select('*').eq('id', id).limit(1)
      if (fErr) return new NextResponse(JSON.stringify({ error: 'Failed to fetch parsed document', details: fErr }), { status: 500 })
      const fullDoc = fullDocs && fullDocs.length ? fullDocs[0] : null
      if (!fullDoc) return new NextResponse(JSON.stringify({ error: 'Parsed document not found' }), { status: 404 })
      return NextResponse.json({ parsed_document: fullDoc })
    }

    // create signed URL valid for 5 minutes
    const { data: urlData, error: urlErr } = await sb.storage.from(bucket).createSignedUrl(path, 60 * 5)
    if (urlErr) return new NextResponse(JSON.stringify({ error: 'Failed to create signed url', details: urlErr }), { status: 500 })

    // redirect to signed url
    return NextResponse.redirect(urlData.signedUrl)
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

export const runtime = 'nodejs'
