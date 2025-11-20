'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { useToast } from '@/components/ToastProvider'
import GoogleButton from '@/components/GoogleButton'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
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
        options: { 
          emailRedirectTo: `${location.origin}/`,
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        },
      })
      if (error) throw error

      // Attempt to save profile with full name
      try {
        if (data.user) {
          await supabase.from('profiles').upsert(
            { 
              id: data.user.id, 
              email: data.user.email,
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`.trim()
            },
            { onConflict: 'id' }
          )
        }
      } catch {}

      setInfo('Account created. Please check your email to confirm.')
      toast({
        title: 'Confirmation email sent',
        description: 'Check your inbox and follow the link to activate your account.',
        variant: 'success',
      })

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

  // GOOGLE SIGNUP
  const signUpWithGoogle = async () => {
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
      setError(err.message || 'Google signup failed')
      toast({
        title: 'Google signup failed',
        description: err.message || 'Something went wrong',
        variant: 'error',
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="w-full max-w-sm mx-auto border-2 border-black rounded-lg p-6 bg-white">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-4">
          Create your account
        </h2>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

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

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-red-600 cursor-pointer"
          >
            {loading ? 'Signing up...' : 'Sign up'}
          </ Button>
        </form>

        {/* GOOGLE SIGN-IN BUTTON */}
        <div className="mt-4">
          <GoogleButton
            onClick={signUpWithGoogle}
            loading={loading}
            text="Sign up with Google"
          />
        </div>
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
