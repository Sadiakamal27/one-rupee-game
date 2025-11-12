 'use client'
 
import GamePlans from '@/components/GamePlans'
 import { useEffect, useState } from 'react'
 import { useRouter } from 'next/navigation'
 import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const [checkedAuth, setCheckedAuth] = useState(false)
 
  useEffect(() => {
    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return
      if (!data.session) {
        router.replace('/signin')
      } else {
        setCheckedAuth(true)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])
 
  if (!checkedAuth) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>
  }
 
  return (
    <div className="min-h-screen bg-white">
      <GamePlans />
    </div>
  )
}
