'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Navbar({ variant = 'app' }: { variant?: 'app' | 'auth' }) {
  const supabase = createClient()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('Player')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)

  useEffect(() => {
    if (variant !== 'app') return
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user
      if (!user) return
      setIsLoggedIn(true)
      setUserEmail(user.email ?? '')
      const metadataRole = (user.user_metadata?.role as string) || ''
      if (metadataRole) {
        setUserRole(metadataRole)
      } else {
        try {
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
          if (profile?.role) setUserRole(profile.role)
        } catch {}
      }
    })
  }, [variant])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      router.replace('/signin')
    }
  }
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-4xl font-bold text-red-600" style={{ fontFamily: 'cursive' }}>
            OneRupeeGame
          </h1>
          {/* user badge removed per request */}
        </div>

        {/* Desktop actions */}
        {variant === 'app' && (
          <nav className="hidden sm:flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Logout
                </button>
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Orders
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Create account
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Mobile hamburger */}
        {variant === 'app' && (
          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 border border-gray-200 bg-white"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg className={`h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        )}
      </div>

      {/* Mobile menu */}
      {variant === 'app' && mobileOpen && (
        <div className="sm:hidden pb-4">
          <div className="flex flex-col gap-2">
            {/* user info removed from mobile menu */}

            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false)
                    handleSignOut()
                  }}
                  className="w-full text-left inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Logout
                </button>
                <Link
                  href="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="w-full inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Orders
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  onClick={() => setMobileOpen(false)}
                  className="w-full inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="w-full inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <div className="border-b-2 border-red-200 mb-6"></div>
    </header>
  )
}


