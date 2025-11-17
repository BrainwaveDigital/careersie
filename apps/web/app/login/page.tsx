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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400 mb-3 tracking-tight">
            Careersie
          </h1>
          <h2 className="text-2xl font-semibold text-white mb-3">
            Find Your Dream Job
          </h2>
          <p className="text-purple-200 text-base leading-relaxed">
            Join thousands of professionals finding their next opportunity
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl animate-shake backdrop-blur-sm">
              <p className="text-sm text-red-200 font-medium">{error}</p>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-5 mb-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition text-white placeholder-purple-300"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
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
                  className="w-full px-4 py-3 pr-10 bg-white/5 border-2 border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition text-white placeholder-purple-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-pink-400/50 disabled:to-purple-400/50 text-white font-bold py-3 rounded-full transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/50 hover:scale-105 disabled:scale-100"
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
            <p className="text-purple-200 text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="text-pink-400 hover:text-pink-300 font-semibold transition">
                Sign up instead
              </Link>
            </p>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white/10 backdrop-blur-sm text-purple-200 font-medium rounded-full">or</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              className="w-full border-2 border-white/20 hover:border-pink-400/50 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-full transition duration-200 flex items-center justify-center gap-3 backdrop-blur-sm"
            >
              <Mail className="w-5 h-5" />
              Sign in with Google
            </button>

            <button
              onClick={() => handleSocialLogin('github')}
              disabled={loading}
              className="w-full border-2 border-white/20 hover:border-pink-400/50 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-full transition duration-200 flex items-center justify-center gap-3 backdrop-blur-sm"
            >
              <Github className="w-5 h-5" />
              Sign in with GitHub
            </button>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-purple-200">
              Don't have an account?{' '}
              <Link href="/signup" className="text-pink-400 font-semibold hover:text-pink-300 transition">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-purple-300">
          <p>
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-pink-400 hover:text-pink-300 font-semibold">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-pink-400 hover:text-pink-300 font-semibold">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

