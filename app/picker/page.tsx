'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, GamePlan } from '@/types/database'
import { Caveat } from 'next/font/google'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const caveat = Caveat({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-caveat',
})

export default function PickerPage() {
  const [plans, setPlans] = useState<GamePlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [planOrders, setPlanOrders] = useState<Order[]>([])
  const [minOrderId, setMinOrderId] = useState<string>('')
  const [maxOrderId, setMaxOrderId] = useState<string>('')
  const [pickedId, setPickedId] = useState<number | null>(null)
  const [winner, setWinner] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const supabase = createClient()

  // Fetch plans from Supabase
  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true)
      const { data, error } = await supabase
        .from('game_plans')
        .select('*')
        .order('price', { ascending: true })

      if (error) {
        console.error('Error fetching plans:', error)
        setPlans([])
      } else {
        setPlans(data || [])
      }
      setLoadingPlans(false)
    }

    fetchPlans()
  }, [supabase])

  // Fetch orders for the selected plan
  useEffect(() => {
    if (!selectedPlanId) {
      setPlanOrders([])
      setMinOrderId('')
      setMaxOrderId('')
      setWinner(null)
      setPickedId(null)
      return
    }

    const fetchOrdersForPlan = async () => {
      setLoadingOrders(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('plan_id', selectedPlanId)
        .eq('payment_status', 'completed')
        .order('order_id', { ascending: true })

      if (error) {
        console.error('Error fetching plan orders:', error)
        setPlanOrders([])
        setMinOrderId('')
        setMaxOrderId('')
      } else {
        const orders = data || []
        setPlanOrders(orders)

        if (orders.length > 0) {
          setMinOrderId(orders[0].order_id ?? '')
          setMaxOrderId(orders[orders.length - 1].order_id ?? '')
        } else {
          setMinOrderId('')
          setMaxOrderId('')
        }
        setWinner(null)
        setPickedId(null)
      }
      setLoadingOrders(false)
    }

    fetchOrdersForPlan()
  }, [selectedPlanId, supabase])

  const handleGenerate = async () => {
    if (!selectedPlanId) {
      alert('Please select a plan first.')
      return
    }

    if (!planOrders.length) {
      alert('No completed orders for this plan yet.')
      return
    }

    setLoading(true)
    setWinner(null)
    setPickedId(null)
    
    try {
      // Pick a random order from the current plan
      const randomIndex = Math.floor(Math.random() * planOrders.length)
      const winnerOrder = planOrders[randomIndex]

      setPickedId(parseInt(winnerOrder.order_id ?? '0', 10))
      setWinner(winnerOrder || null)
    } catch (err) {
      console.error('Error fetching winner:', err)
      setWinner(null)
    } finally {
      setLoading(false)
    }
  }

  const formatOrderId = (id?: string | null) => {
    if (!id) return ''
    return id.padStart(7, '0')
  }

  const selectedPlan = selectedPlanId
    ? plans.find((plan) => plan.id === selectedPlanId)
    : null

  const canGenerate = Boolean(
    selectedPlanId && planOrders.length > 0 && !loading && !loadingOrders
  )

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

        {/* Plan Selector */}
        <div className="mb-6">
          <Select
            value={selectedPlanId ? String(selectedPlanId) : ''}
            onValueChange={(value: string) =>
              setSelectedPlanId(value ? Number(value) : null)
            }
            disabled={loadingPlans || plans.length === 0}
          >
            <SelectTrigger className="h-14 rounded-2xl border-2 border-black px-5 text-lg font-semibold shadow-[0_4px_0_0_rgba(0,0,0,0.25)]">
              <SelectValue
                placeholder={
                  loadingPlans ? 'Loading plans...' : 'Select plan'
                }
              />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-2 border-black">
              {plans.length === 0 && !loadingPlans && (
                <SelectItem value="__empty" disabled>
                  No plans available
                </SelectItem>
              )}
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={String(plan.id)}>
                  {plan.reward_title} (Rs{plan.price})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* {selectedPlan && (
            <p className="text-xs text-gray-500 mt-2">
              Goal: {selectedPlan.goal_amount.toLocaleString()} Rs
            </p>
          )} */}
        </div>

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
                  type="text"
                  value={formatOrderId(minOrderId)}
                  readOnly
                  className="w-32 px-3 py-2 rounded bg-white text-black border-2 border-gray-300 focus:outline-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-white text-sm mb-1">Max</label>
                <input
                  type="text"
                  value={formatOrderId(maxOrderId)}
                  readOnly
                  className="w-32 px-3 py-2 rounded bg-white text-black border-2 border-gray-300 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="mt-6 text-center">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              {loading ? 'GENERATING...' : 'GENERATE'}
            </button>
            {!selectedPlanId && (
              <p className="text-xs text-gray-300 mt-2">
                Select a plan to enable the picker.
              </p>
            )}
            {selectedPlanId && !planOrders.length && !loadingOrders && (
              <p className="text-xs text-gray-300 mt-2">
                No completed orders yet for this plan.
              </p>
            )}
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

