'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'
import { Mail, Github, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      // If a session was returned, persist it to a cookie so server-rendered
      // pages can read the access_token. Supabase client persists to localStorage
      // by default; we mirror the session into a cookie here for server-side use.
      try {
        const session = (data as any)?.session
        if (session && session.access_token) {
          // Mirror session server-side into an HttpOnly cookie for server-rendered pages.
          try {
            await fetch('/api/auth/mirror', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session }),
              credentials: 'same-origin',
            })
          } catch (e) {
            // fallback to client-side cookie if server mirror fails
            const cookieVal = encodeURIComponent(JSON.stringify(session))
            const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'Secure;SameSite=Strict;' : 'SameSite=Lax;'
            let expires = ''
            if (session.expires_at) {
              const dt = new Date(session.expires_at * 1000)
              expires = `; Expires=${dt.toUTCString()}`
            }
            document.cookie = `supabase-auth-token=${cookieVal}; Path=/; ${secure}${expires}`
          }
        }
      } catch (e) {
        // non-fatal
        console.warn('Failed to set session cookie', e)
      }

      // Redirect to dashboard on success
      router.push('/dashboard')
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabaseClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }} className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 style={{ color: '#FFFFFF' }} className="text-5xl font-bold mb-3 tracking-tight">
            Careersie
          </h1>
          <h2 style={{ color: '#FFFFFF' }} className="text-2xl font-semibold mb-3">
            Find Your Dream Job
          </h2>
          <p style={{ color: '#9AA4B2' }} className="text-base leading-relaxed">
            Join thousands of professionals finding their next opportunity
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(25px)',
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
          borderRadius: '24px',
          padding: '32px'
        }}>
          {/* Error Message */}
          {error && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'rgba(255, 60, 60, 0.15)',
              border: '1px solid rgba(255, 60, 60, 0.4)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <p style={{ fontSize: '14px', color: '#ff6b6b', fontWeight: '500' }}>{error}</p>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5 mb-6">
            <div>
              <label htmlFor="email" style={{ color: '#9AA4B2' }} className="block text-sm font-semibold mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  padding: '12px 16px',
                  width: '100%',
                  transition: 'all 0.2s ease'
                }}
                className="placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
              />
            </div>

            <div>
              <label htmlFor="password" style={{ color: '#9AA4B2' }} className="block text-sm font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    padding: '12px 16px',
                    paddingRight: '40px',
                    width: '100%',
                    transition: 'all 0.2s ease'
                  }}
                  className="placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ color: '#9AA4B2' }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:text-white transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? 'rgba(79, 241, 227, 0.4)' : 'linear-gradient(135deg, #4ff1e3, #536dfe)',
                borderRadius: '14px',
                padding: '12px',
                width: '100%',
                color: '#FFFFFF',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(79, 241, 227, 0.3)',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              className={!loading ? 'hover:shadow-[0_6px_20px_rgba(79,241,227,0.4)] hover:-translate-y-0.5' : ''}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="text-center mb-6">
            <p style={{ color: '#9AA4B2', fontSize: '14px' }}>
              Don't have an account?{' '}
              <Link href="/signup" style={{ color: '#4ff1e3' }} className="hover:opacity-80 font-semibold transition">
                Sign up instead
              </Link>
            </p>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', width: '100%' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span style={{
                padding: '0 12px',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#9AA4B2',
                fontWeight: '500',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)'
              }}>or</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '12px',
                width: '100%',
                color: '#FFFFFF',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? '0.5' : '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
              className={!loading ? 'hover:border-cyan-400/50 hover:bg-white/10 hover:-translate-y-0.5' : ''}
            >
              <Mail className="w-5 h-5" />
              Sign in with Google
            </button>

            <button
              onClick={() => handleSocialLogin('github')}
              disabled={loading}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '14px',
                padding: '12px',
                width: '100%',
                color: '#FFFFFF',
                fontWeight: 'bold',
                transition: 'all 0.2s ease',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? '0.5' : '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}
              className={!loading ? 'hover:border-cyan-400/50 hover:bg-white/10 hover:-translate-y-0.5' : ''}
            >
              <Github className="w-5 h-5" />
              Sign in with GitHub
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p style={{ fontSize: '14px', color: '#9AA4B2' }}>
              Don't have an account?{' '}
              <Link href="/signup" style={{ color: '#4ff1e3', fontWeight: '600' }} className="hover:opacity-80 transition">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8" style={{ fontSize: '12px', color: '#9AA4B2' }}>
          <p>
            By signing in, you agree to our{' '}
            <Link href="/terms" style={{ color: '#4ff1e3', fontWeight: '600' }} className="hover:opacity-80">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" style={{ color: '#4ff1e3', fontWeight: '600' }} className="hover:opacity-80">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

