import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const session = body?.session
    if (!session) return NextResponse.json({ error: 'Missing session' }, { status: 400 })

    // Prefer to store the whole session JSON so server pages can extract access_token
    const cookieVal = encodeURIComponent(JSON.stringify(session))

    // compute expires if available
    let expiresStr = ''
    if (session.expires_at) {
      const dt = new Date(session.expires_at * 1000)
      expiresStr = `; Expires=${dt.toUTCString()}`
    }

    // Build Set-Cookie header. HttpOnly for security.
    const secure = process.env.NODE_ENV === 'production' ? 'Secure;SameSite=Strict;' : 'SameSite=Lax;'
    const cookie = `supabase-auth-token=${cookieVal}; Path=/; HttpOnly; ${secure}${expiresStr}`

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    })
  } catch (err) {
    console.error('mirror cookie error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
