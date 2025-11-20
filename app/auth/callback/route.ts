import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const next = requestUrl.searchParams.get('next') || '/'

  // If there's an error, redirect to signin with error message
  if (error) {
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(error)}`, requestUrl.origin)
    )
  }

  // If there's a code, exchange it for a session
  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      return NextResponse.redirect(
        new URL(`/signin?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      )
    }

    // If this is a new user from OAuth, save their profile
    if (data.user) {
      try {
        // Get full name from user metadata (provided by OAuth providers)
        const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || ''
        const firstName = data.user.user_metadata?.given_name || ''
        const lastName = data.user.user_metadata?.family_name || ''
        
        // Save or update profile
        await supabase.from('profiles').upsert(
          {
            id: data.user.id,
            email: data.user.email,
            first_name: firstName,
            last_name: lastName,
            full_name: fullName || `${firstName} ${lastName}`.trim(),
          },
          { onConflict: 'id' }
        )
      } catch (error) {
        // Log error but don't fail the authentication
        console.error('Failed to save OAuth profile:', error)
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}

