 'use client'
 
import GamePlans from '@/components/GamePlans'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const supabase = createClient()
  const [ready, setReady] = useState(false)
 
  useEffect(() => {
    // Public homepage: allow viewing even when not logged in
    setReady(true)
  }, [])
 
  if (!ready) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>
  }
 
  return (
    <div className="min-h-screen bg-white">
      <GamePlans />
    </div>
  )
}
