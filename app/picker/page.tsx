'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/types/database'
import { Caveat } from 'next/font/google'

const caveat = Caveat({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-caveat',
})

export default function PickerPage() {
  const [min, setMin] = useState<number>(1)
  const [max, setMax] = useState<number>(48484)
  const [pickedId, setPickedId] = useState<number | null>(null)
  const [winner, setWinner] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // Fetch total completed orders to set default max
  useEffect(() => {
    const fetchOrderCount = async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', 'completed')
      
      if (count && count > 0) {
        setMax(count)
      }
    }
    fetchOrderCount()
  }, [supabase])

  const handleGenerate = async () => {
    if (min >= max || min < 1) {
      alert('Invalid range. Min must be less than Max and both must be positive.')
      return
    }

    setLoading(true)
    setWinner(null)
    
    // Generate random participant number between min and max (inclusive)
    const randomParticipantNumber = Math.floor(Math.random() * (max - min + 1)) + min
    setPickedId(randomParticipantNumber)

    try {
      // Fetch all completed orders ordered by creation time (oldest first)
      // This gives us sequential participant numbers
      const { data: allOrders, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: true })

      if (fetchError || !allOrders || allOrders.length === 0) {
        setWinner(null)
        setLoading(false)
        return
      }

      // Check if the picked participant number is within range
      if (randomParticipantNumber < 1 || randomParticipantNumber > allOrders.length) {
        setWinner(null)
        setLoading(false)
        return
      }

      // Get the participant at the picked position (array is 0-indexed, so subtract 1)
      const winnerOrder = allOrders[randomParticipantNumber - 1]
      
      if (winnerOrder) {
        setWinner(winnerOrder)
      } else {
        setWinner(null)
      }
    } catch (err) {
      console.error('Error fetching winner:', err)
      setWinner(null)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (winner && winner.order_id) {
      const orderId = winner.order_id.padStart(7, '0')
      const text = `${orderId}: ${winner.name.toUpperCase()} WON!`
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'OneRupeeGame Winner',
            text: text,
          })
        } catch (err) {
          // Fallback to clipboard
          navigator.clipboard.writeText(text)
        }
      } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(text)
      }
    }
  }

  return (
    <div className={`min-h-screen bg-white p-4 ${caveat.variable}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h2 className="text-2xl font-bold mb-6">Random ID Picker</h2>

        {/* Picker Widget */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 relative">
          {/* Share Icon */}
          <button
            onClick={handleShare}
            disabled={!winner || !pickedId}
            className="absolute top-4 right-4 text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Share"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Picked Number */}
            <div className="flex-1 text-center sm:text-left">
              <div 
                className="text-6xl sm:text-7xl font-bold text-white"
                style={{ fontFamily: 'var(--font-caveat), cursive' }}
              >
                {winner && winner.order_id 
                  ? winner.order_id.padStart(7, '0')
                  : pickedId !== null 
                    ? pickedId.toString().padStart(7, '0') 
                    : '—'}
              </div>
            </div>

            {/* Min/Max Inputs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col">
                <label className="text-white text-sm mb-1">Min</label>
                <input
                  type="number"
                  value={min}
                  onChange={(e) => setMin(parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-24 px-3 py-2 rounded bg-white text-black border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-white text-sm mb-1">Max</label>
                <input
                  type="number"
                  value={max}
                  onChange={(e) => setMax(parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-24 px-3 py-2 rounded bg-white text-black border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-6 text-center">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              {loading ? 'GENERATING...' : 'GENERATE'}
            </button>
          </div>
        </div>

        {/* Winner Announcement */}
        {winner && winner.order_id && (
          <div className="text-center text-green-600 text-2xl sm:text-3xl font-bold mb-6">
            {winner.order_id.padStart(7, '0')}: {winner.name.toUpperCase()} WON!
          </div>
        )}

        {pickedId && !winner && !loading && (
          <div className="text-center text-gray-500 text-lg mb-6">
            No winner found for participant number {pickedId}
          </div>
        )}
      </div>
    </div>
  )
}

