'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase/client'
import { GitHubIcon } from '@/app/icons/gitHubIcon'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'github' | 'google' | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)

  // ── If already signed in, push to /login (sign-in page) ──
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // router.replace('/login')
      } else {
        setCheckingSession(false)
      }
    })
  }, [router])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, fullName }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Signup failed. Please try again.')
        return
      }

      // Show success briefly, then redirect to sign-in
      setSuccess('Account created! Redirecting you to sign in…')
    //   setTimeout(() => router.push('/login'), 2000)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignup = async (provider: 'github' | 'google') => {
    setOauthLoading(provider)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError(error.message)
      setOauthLoading(null)
    }
  }

  const passwordStrength = (() => {
    if (!password) return null
    if (password.length < 6) return { label: 'Weak', color: '#ff4757', width: '25%' }
    if (password.length < 8) return { label: 'Fair', color: '#ffa502', width: '50%' }
    if (password.length < 12 || !/[^a-zA-Z0-9]/.test(password))
      return { label: 'Good', color: '#2ed573', width: '75%' }
    return { label: 'Strong', color: '#2ed573', width: '100%' }
  })()

  // Blank screen while checking session to avoid flash
  if (checkingSession) return null

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-mark">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="white" fillOpacity="0.9"/>
            </svg>
          </div>
          <span className="auth-logo-text">Nexus</span>
        </div>

        <h1 className="auth-heading">Create account</h1>
        <p className="auth-subheading">Join thousands of teams already using Nexus</p>

        {/* OAuth buttons */}
        <button
          className="oauth-btn"
          onClick={() => handleOAuthSignup('google')}
          disabled={!!oauthLoading || loading}
        >
          {oauthLoading === 'google' ? <span className="spinner" /> : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          )}
          Sign up with Google
        </button>

        <button
          className="oauth-btn"
          onClick={() => handleOAuthSignup('github')}
          disabled={!!oauthLoading || loading}
        >
          {oauthLoading === 'github' ? <span className="spinner" /> : <GitHubIcon  />}
          Sign up with GitHub
        </button>

        <div className="auth-divider">or</div>

        {error && (
          <div className="error-box">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6.5" stroke="currentColor"/>
              <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {success && <div className="success-box">✓ {success}</div>}

        {!success && (
          <form onSubmit={handleSignup}>
            <div className="field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
              />
              {passwordStrength && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ height: '3px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: passwordStrength.width,
                      background: passwordStrength.color,
                      borderRadius: '4px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <p className="password-hint" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label} password
                  </p>
                </div>
              )}
            </div>

            <button className="submit-btn" type="submit" disabled={loading || !!oauthLoading}>
              {loading ? <><span className="spinner" />Creating account…</> : 'Create account'}
            </button>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
              By signing up you agree to our{' '}
              <a href="#" style={{ color: 'var(--text-secondary)' }}>Terms</a> and{' '}
              <a href="#" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</a>
            </p>
          </form>
        )}

        <p className="auth-footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}