'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'
import { Mail, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { data, error: authError } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
          },
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
        }
      })

      if (authError) {
        setError(authError.message)
        return
      }

      // Create profile via API route (uses service role to bypass RLS)
      if (data.user) {
        const profileResponse = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.user.id,
            name: fullName,
            email: email,
            username: username,
          }),
        })

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json()
          console.error('Profile creation error:', errorData)
          setError(`Database error: ${errorData.error || 'Unknown error'}`)
          return
        }
        
        console.log('Profile created successfully')
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        setSuccess(true)
        setError('Please check your email to confirm your account.')
      } else if (data.session) {
        // If auto-confirmed, redirect to dashboard
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }} className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(25px)',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.4)',
            borderRadius: '24px',
            padding: '32px'
          }}>
            <div className="text-center mb-6">
              <div style={{
                width: '64px',
                height: '64px',
                background: 'rgba(79, 241, 227, 0.15)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Mail style={{ width: '32px', height: '32px', color: '#4ff1e3' }} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF', marginBottom: '8px' }}>Check Your Email</h2>
              <p style={{ color: '#9AA4B2' }}>
                We've sent a confirmation link to <strong style={{ color: '#FFFFFF' }}>{email}</strong>
              </p>
              <p style={{ color: '#9AA4B2', marginTop: '16px', fontSize: '14px' }}>
                Click the link in the email to activate your account.
              </p>
            </div>
            <Link
              href="/login"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#FFFFFF',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                textDecoration: 'none'
              }}
              className="hover:bg-white/10 hover:-translate-y-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #0D1117 0%, #0A0F14 100%)' }} className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 style={{ color: '#FFFFFF' }} className="text-4xl font-bold mb-3 tracking-tight">
            Careersie
          </h1>
          <h2 style={{ color: '#FFFFFF' }} className="text-2xl font-semibold mb-3">
            Create Your Account
          </h2>
          <p style={{ color: '#9AA4B2' }} className="text-base leading-relaxed">
            Join thousands of professionals finding their next opportunity
          </p>
        </div>

        {/* Signup Card */}
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
              borderRadius: '12px'
            }}>
              <p style={{ fontSize: '14px', color: '#ff6b6b', fontWeight: '500' }}>{error}</p>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label htmlFor="fullName" style={{ color: '#9AA4B2' }} className="block text-sm font-semibold mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
              <label htmlFor="username" style={{ color: '#9AA4B2' }} className="block text-sm font-semibold mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="yourusername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#9AA4B2', marginTop: '4px' }}>At least 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" style={{ color: '#9AA4B2' }} className="block text-sm font-semibold mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p style={{ fontSize: '14px', color: '#9AA4B2' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#4ff1e3', fontWeight: '600' }} className="hover:opacity-80 transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Quick Test Account Hint (Dev Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <p style={{ fontSize: '12px', color: '#ffc107' }}>
              <strong>Dev Mode:</strong> Use any email format like test{Math.floor(Math.random() * 100)}@example.com for quick testing
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
