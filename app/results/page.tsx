'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GamePlan } from '@/types/database'
import { Caveat } from 'next/font/google'

const caveat = Caveat({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-caveat',
})

export default function ResultsPage() {
  const [plans, setPlans] = useState<GamePlan[]>([])
  const [timeLeft, setTimeLeft] = useState<Record<number, string>>({})
  const supabase = createClient()

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('game_plans')
      .select('*')
      .order('price', { ascending: true })

    if (error) {
      console.error('Error fetching plans:', error)
    } else {
      setPlans(data || [])
    }
  }

  const updateTimers = useCallback(() => {
    if (plans.length === 0) return

    const now = new Date()
    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000 // 2 days in milliseconds
    
    const timers: Record<number, string> = {}
    
    plans.forEach(plan => {
      // Get plan end date
      const endDate = plan.end_date ? new Date(plan.end_date) : null
      
      if (!endDate) {
        return // Skip plans without end date
      }

      const msLeft = endDate.getTime() - now.getTime()
      
      // Only calculate timer if plan ends within 2 days and hasn't ended
      if (msLeft > 0 && msLeft <= twoDaysInMs) {
        const days = Math.floor(msLeft / (1000 * 60 * 60 * 24))
        const hours = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((msLeft % (1000 * 60)) / 1000)

        // Format: -DD:HH:MM:SS or -HH:MM:SS if no days
        let formatted: string
        if (days > 0) {
          formatted = `-${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        } else {
          formatted = `-${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        }
        
        timers[plan.id] = formatted
      }
      // Plans with more than 2 days or that have ended are not shown
    })
    
    setTimeLeft(timers)
  }, [plans])

  useEffect(() => {
    fetchPlans()
  }, [])

  useEffect(() => {
    // Update timer every second
    const interval = setInterval(() => {
      updateTimers()
    }, 1000)

    // Initial update
    updateTimers()

    return () => clearInterval(interval)
  }, [updateTimers])

  // Filter plans to only show those with 2 days or less remaining
  const now = new Date()
  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000
  const plansWithTimer = plans.filter(plan => {
    if (!plan.end_date) return false
    const endDate = new Date(plan.end_date)
    const msLeft = endDate.getTime() - now.getTime()
    // Only show plans that have ended or have 2 days or less remaining
    return msLeft > 0 && msLeft <= twoDaysInMs
  })

  return (
    <div className={`min-h-screen bg-white p-4 ${caveat.variable}`}>
      <div className="max-w-6xl mx-auto">
        {/* Results Header */}
        <h2 className="text-2xl font-bold mb-6">Results</h2>

        {/* Plans with Timers */}
        <div className="border-2 border-black rounded-lg overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gray-100 border-b-2 border-black grid grid-cols-2 gap-4 p-4 font-bold">
            <div>Offer</div>
            <div>Time Remaining</div>
          </div>

          {/* Plan Rows */}
          {plansWithTimer.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No plans ending within 2 days
            </div>
          ) : (
            plansWithTimer.map((plan, index) => {
              // Show timer with handwritten font
              const displayText = timeLeft[plan.id] || '-00:00:00'
              const displayStyle: React.CSSProperties = { fontFamily: 'var(--font-caveat), cursive' }
              const displayClassName = 'text-6xl sm:text-6xl font-bold whitespace-nowrap'
              
              return (
                <div
                  key={plan.id}
                  className="grid grid-cols-2 gap-4 p-4 border-b border-gray-300 hover:bg-gray-50 last:border-b-0"
                >
                  <div className="font-semibold">
                    {plan.reward_title} (Offer {index + 1})
                  </div>
                  <div 
                    className={displayClassName}
                    style={displayStyle}
                  >
                    {displayText}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Live Started Box */}
        <div className="border-2 border-black rounded-lg p-6 bg-white">
          <p className="text-base sm:text-lg">
            Live Started on : Instagram.com/onerupee.com
          </p>
        </div>
      </div>
    </div>
  )
}

