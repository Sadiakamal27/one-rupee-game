'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, GamePlan } from '@/types/database'
import Link from 'next/link'
import { Caveat } from 'next/font/google'

const caveat = Caveat({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-caveat',
})

export default function OrdersPage() {
  const [orders, setOrders] = useState<(Order & { plan?: GamePlan })[]>([])
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState<Record<number, string>>({})
  const [expiredOrders, setExpiredOrders] = useState<Set<number>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *, 
        plan:game_plans(*),
        profile:profiles!user_id(full_name, first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
    } else {
      setOrders(data || [])
    }
    setLoading(false)
  }

  const updateTimers = useCallback(() => {
    const now = new Date()
    const newTimeLeft: Record<number, string> = {}
    const newExpiredOrders = new Set<number>()

    // Group orders by plan_id to ensure all orders for the same active plan use the same end date
    const planEndDates: Record<number, Date> = {}
    
    // First pass: Calculate effective end dates per plan (not per order)
    orders.forEach(order => {
      if (!order.plan?.end_date || !order.plan.id) return
      
      // If we already calculated this plan's end date, skip
      if (planEndDates[order.plan.id]) return
      
      const dbEndDate = new Date(order.plan.end_date)
      let effectiveEndDate = dbEndDate

      // If plan is currently active (end_date is in the future), use the plan's end_date for all orders
      if (dbEndDate.getTime() >= now.getTime()) {
        // Plan is active - use the plan's end_date for all orders of this plan
        effectiveEndDate = dbEndDate
      } else {
        // Plan is expired - use virtual mode logic only for orders created after plan expired
        // For active plans, we'll handle this in the second pass
        effectiveEndDate = dbEndDate
      }
      
      planEndDates[order.plan.id] = effectiveEndDate
    })

    // Second pass: Calculate timers for each order using the plan's effective end date
    orders.forEach(order => {
      if (!order.plan?.end_date || !order.plan.id) return
      
      const orderDate = new Date(order.created_at)
      const planEffectiveEndDate = planEndDates[order.plan.id]
      let effectiveEndDate = planEffectiveEndDate

      // Only apply virtual mode logic if plan is expired
      if (planEffectiveEndDate.getTime() < now.getTime()) {
        // Plan is expired - check if this is a virtual order (created after plan expired)
        if (orderDate.getTime() > planEffectiveEndDate.getTime()) {
          // Virtual order - 15 days from creation
          effectiveEndDate = new Date(orderDate.getTime() + 15 * 24 * 60 * 60 * 1000)
        }
        // Else: Order was created before plan expired -> use plan's expired date
      }
      // If plan is active, all orders use the same plan end_date (already set above)

      const msLeft = effectiveEndDate.getTime() - now.getTime()

      if (msLeft > 0) {
        const days = Math.floor(msLeft / (1000 * 60 * 60 * 24))
        const hours = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60))

        let formatted = ''
        if (days > 0) {
          formatted = `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
        } else {
          formatted = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
        }

        newTimeLeft[order.id] = formatted
      } else {
        // expired
        newExpiredOrders.add(order.id)
        newTimeLeft[order.id] = effectiveEndDate.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      }
    })

    setTimeLeft(newTimeLeft)
    setExpiredOrders(newExpiredOrders)
  }, [orders])

  useEffect(() => {
    const interval = setInterval(updateTimers, 1000)
    updateTimers()
    return () => clearInterval(interval)
  }, [updateTimers])

  return (
    <div className={`min-h-screen bg-white p-4 ${caveat.variable}`}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">All Orders</h2>

        {/* Orders Table */}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <div className="border-2 border-black rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-100 border-b-2 border-black grid grid-cols-4 gap-4 p-4 font-bold">
              <div>ID</div>
              <div>Name</div>
              <div>Offer</div>
              <div>Ends</div>
            </div>

            {/* Table Rows */}
            {orders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No orders yet</div>
            ) : (
              orders.map(order => {
                // Use profile name if available, otherwise fallback to order name
                const displayName = order.profile?.full_name ||
                  (order.profile?.first_name && order.profile?.last_name
                    ? `${order.profile.first_name} ${order.profile.last_name}`.trim()
                    : order.name);

                return (
                  <div
                    key={order.id}
                    className="grid grid-cols-4 gap-4 p-4 border-b border-gray-300 hover:bg-gray-50"
                  >
                    <div className="font-mono">{order.order_id || order.id}</div>
                    <div>{displayName}</div>
                    <div>Rs{order.amount} - {order.plan?.reward_title || 'N/A'}</div>
                    <div
                      className={`font-bold text-2xl`}
                      style={{
                        fontFamily: 'var(--font-caveat), cursive',
                        color: expiredOrders.has(order.id) ? 'red' : 'green',
                      }}
                    >
                      {timeLeft[order.id] || (order.plan ? new Date(order.plan.end_date).toLocaleDateString('en-GB') : 'N/A')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
