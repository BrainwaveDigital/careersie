"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, AlertCircle } from 'lucide-react'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Authentication failed')
        setLoading(false)
        return
      }

      // Verify the user is an admin
      const { data: isAdmin, error: adminCheckError } = await supabaseClient
        .rpc('is_admin')

      if (adminCheckError) {
        setError('Failed to verify admin status')
        await supabaseClient.auth.signOut()
        setLoading(false)
        return
      }

      if (!isAdmin) {
        setError('Access denied. This area is for administrators only.')
        await supabaseClient.auth.signOut()
        setLoading(false)
        return
      }

      // Check if admin account is active
      const { data: adminData, error: adminError } = await supabaseClient
        .from('app_admins')
        .select('is_active, account_locked_until')
        .eq('user_id', authData.user.id)
        .single()

      if (adminError || !adminData) {
        setError('Failed to load admin account details')
        await supabaseClient.auth.signOut()
        setLoading(false)
        return
      }

      if (!adminData.is_active) {
        setError('Your admin account has been deactivated. Please contact a super administrator.')
        await supabaseClient.auth.signOut()
        setLoading(false)
        return
      }

      if (adminData.account_locked_until) {
        const lockUntil = new Date(adminData.account_locked_until)
        if (lockUntil > new Date()) {
          setError(`Account is locked until ${lockUntil.toLocaleString()}`)
          await supabaseClient.auth.signOut()
          setLoading(false)
          return
        }
      }

      // Update last activity
      await supabaseClient
        .from('app_admins')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('user_id', authData.user.id)

      // Redirect to admin dashboard
      router.push('/admin')
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white">Admin Login</CardTitle>
          <CardDescription className="text-slate-400">
            Enter your administrator credentials to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-center text-sm text-slate-400">
              Not an administrator?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Go to User Login
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
