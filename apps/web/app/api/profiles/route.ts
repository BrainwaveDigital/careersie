import { getSupabaseServerWithAuth } from '@/lib/supabase.server'

export async function POST(request: Request) {
  try {
    const { userId, name, email } = await request.json()

    console.log('[API /profiles POST] Request received:', { userId, name, email })

    // Validate input
    if (!userId || !name) {
      return Response.json(
        { error: 'Missing required fields: userId, name' },
        { status: 400 }
      )
    }

    // This runs on the server with service role key → safe to bypass RLS
    const supabaseServer = await getSupabaseServerWithAuth()
    
    // Split name into first and last
    const nameParts = name.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    
    console.log('[API /profiles POST] Attempting to create/update user in public.users...')
    
    // 1. Create/update user in public.users table (only basic columns for now)
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .upsert({ 
        id: userId,
        email: email,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })
      .select()

    if (userError) {
      console.error('[API /profiles POST] User table error:', {
        message: userError.message,
        details: userError.details,
        hint: userError.hint,
        code: userError.code
      })
      return Response.json({ 
        error: `User table error: ${userError.message}`,
        details: userError.details,
        hint: userError.hint,
        code: userError.code
      }, { status: 500 })
    }

    console.log('[API /profiles POST] User created/updated successfully:', userData)
    console.log('[API /profiles POST] Attempting to create profile...')

    // 2. Create profile in profiles table
    const profileId = crypto.randomUUID();
    const { data, error } = await supabaseServer
      .from('profiles')
      .insert({ 
        id: profileId,
        user_id: userId, 
        full_name: name, 
        email: email 
      })
      .select()

    if (error) {
      console.error('[API /profiles POST] Profile table error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return Response.json({ 
        error: `Profile error: ${error.message}`,
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 500 })
    }

    console.log('[API /profiles POST] Profile created successfully:', data)
    return Response.json({ data }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[API /profiles POST] Unexpected error:', err)
    return Response.json({ 
      error: message,
      stack: err instanceof Error ? err.stack : undefined
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return Response.json(
        { error: 'Missing required query parameter: userId' },
        { status: 400 }
      )
    }

    // Fetch user profile
    const supabaseServer = await getSupabaseServerWithAuth()
    const { data, error } = await supabaseServer
      .from('profiles')
      .select()
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json(
          { error: 'Profile not found' },
          { status: 404 }
        )
      }
      console.error('Supabase error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
