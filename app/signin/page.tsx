'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import GoogleButton from '@/components/GoogleButton'
import { Button } from "@/components/ui/button"

export default function SigninPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  // Check for error in URL params (from OAuth callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    if (errorParam) {
      setError(errorParam)
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const signInWithGoogle = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      if (error) throw error
      // Note: The redirect will happen automatically, so we don't need to do anything here
    } catch (err: any) {
      setError(err.message || 'Google sign in failed')
      setLoading(false)
    }
  }

  const resendConfirmation = async () => {
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${location.origin}/` },
      })
      if (error) throw error
      setInfo('Confirmation email sent. Please check your inbox.')
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation email')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNeedsConfirm(false)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="w-full max-w-sm mx-auto border-2 border-black rounded-lg p-6 bg-white">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-4">
          Welcome back
        </h2>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-red-600 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        {needsConfirm && (
          <div className="mt-3">
            <Button
              onClick={resendConfirmation}
              disabled={loading || !email}
              variant="secondary"
              className="w-full cursor-pointer"
            >
              Resend confirmation email
            </Button>
          </div>
        )}

        {/* GOOGLE SIGN-IN BUTTON */}
        <div className="mt-4">
          <GoogleButton
            onClick={signInWithGoogle}
            loading={loading}
            text="Sign in with Google"
          />
        </div>

        <p className="text-sm mt-3 text-center">
          New here?{' '}
          <Link href="/signup" className="text-blue-600 underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}