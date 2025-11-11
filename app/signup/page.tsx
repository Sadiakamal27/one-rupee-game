'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { useToast } from '@/components/ToastProvider'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const toast = useToast()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/` },
      })
      if (error) throw error
      // Attempt to save a basic profile (ignore if table not present)
      try {
        if (data.user) {
          await supabase.from('profiles').upsert(
            { id: data.user.id, email: data.user.email },
            { onConflict: 'id' }
          )
        }
      } catch {
        // ignore if profiles table doesn't exist or RLS blocks it
      }
      setInfo('Account created. Please check your email to confirm your address.')
      toast({
        title: 'Confirmation email sent',
        description: 'Check your inbox and follow the link to activate your account.',
        variant: 'success',
      })
      // Guide the user to sign in after confirmation
      setTimeout(() => router.push('/signin'), 1200)
    } catch (err: any) {
      setError(err.message || 'Signup failed')
      toast({
        title: 'Signup failed',
        description: err.message || 'Something went wrong',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <Navbar variant="auth" />
      <div className="w-full max-w-sm mx-auto border-2 border-black rounded-lg p-6 bg-white">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-4">
          Create your account
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
              minLength={6}
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
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>
        <p className="text-sm mt-3 text-center">
          Already have an account?{' '}
          <Link href="/signin" className="text-blue-600 underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}


