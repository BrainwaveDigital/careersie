'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import OrbMenu from '@/components/OrbMenu'

interface User {
  id: string
  email?: string
  user_metadata?: Record<string, any>
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabaseClient.auth.getUser()

        console.log('Dashboard auth check:', { user: user?.email, error })

        if (error || !user) {
          console.log('Redirecting to login - no user')
          router.push('/login')
          return
        }

        console.log('User authenticated, setting user')
        setUser(user as User)
      } catch (err) {
        console.error('Auth check error:', err)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  console.log('Dashboard render - loading:', loading, 'user:', user?.email)

  if (loading) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div style={{ borderColor: '#4ff1e3' }} className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 mb-4"></div>
          <h2 style={{ color: '#FFFFFF' }} className="text-xl font-semibold">Loading your dashboard...</h2>
        </div>
      </div>
    )
  }

  if (!user) return null

  return <OrbMenu />
}
