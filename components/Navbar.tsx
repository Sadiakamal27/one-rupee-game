'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Navbar({ variant = 'app' }: { variant?: 'app' | 'auth' }) {
  const supabase = createClient()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    if (variant !== 'app') {
      setIsCheckingAuth(false)
      return
    }

    // 1. Initial check
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setIsLoggedIn(!!user)
      } catch (error) {
        setIsLoggedIn(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()

    // 2. Live auth listener for login / logout / OAuth redirects
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user)
      setIsCheckingAuth(false)
    })

    // 3. Cleanup
    return () => {
      subscription.unsubscribe()
    }
  }, [variant, supabase])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      router.replace('/signin')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-4">
        <Link
          href="/"
          className="inline-block text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          <h1
            className="text-2xl sm:text-3xl font-bold text-red-600"
            style={{ fontFamily: 'cursive' }}
          >
            OneRupeeGame
          </h1>
        </Link>

        <div className="flex items-center space-x-2">
          {/* Only show these when logged in and auth check is complete */}
          {!isCheckingAuth && isLoggedIn && (
            <>
              <Link
                href="/results"
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Results
              </Link>

              <Link
                href="/picker"
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Picker
              </Link>

              <Link
                href="/orders"
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Orders
              </Link>

              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Logout
              </button>
            </>
          )}

          {/* Show sign in/sign up when not logged in and auth check is complete */}
          {!isCheckingAuth && !isLoggedIn && (
            <>
              <Link
                href="/signin"
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Sign in
              </Link>

              <Link
                href="/signup"
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="border-b-2 border-red-200 mb-6"></div>
    </div>
  )
}
