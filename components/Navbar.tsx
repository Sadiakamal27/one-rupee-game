'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Navbar({ variant = 'app' }: { variant?: 'app' | 'auth' }) {
  const supabase = createClient()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    if (variant !== 'app') return
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setIsLoggedIn(true)
    })
  }, [variant])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      router.replace('/signin')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Navbar container */}
      <div className="flex justify-between items-center py-4">
        {/* Game name on the left */}
        <Link
            href="/"
            className="inline-block  text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
        <h1
          className="text-2xl sm:text-3xl font-bold text-red-600"
          style={{ fontFamily: 'cursive' }}
        >
          OneRupeeGame
        </h1>
        </Link>

        {/* Right-side navigation */}
        <div className="flex items-center space-x-2">
          {isLoggedIn ? (
            <>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Logout
              </button>
              <Link
                href="/orders"
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Orders
              </Link>
            </>
          ) : (
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

      {/* Bottom border */}
      <div className="border-b-2 border-red-200 mb-6"></div>
    </div>
  )
}
