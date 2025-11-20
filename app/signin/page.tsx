'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

export default function SigninPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

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
    setInfo(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // Handle the common "Email not confirmed" case gracefully
        const msg = (error.message || '').toLowerCase()
        if (msg.includes('confirm') || msg.includes('not confirmed') || msg.includes('verify')) {
          setNeedsConfirm(true)
          setError('Your email is not confirmed. Please confirm your email to continue.')
        } else {
          throw error
        }
        return
      }
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <Navbar variant="auth" />
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-md font-semibold transition disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        {needsConfirm && (
          <div className="mt-3">
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={loading || !email}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold transition disabled:opacity-60"
            >
              Resend confirmation email
            </button>
          </div>
        )}
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


