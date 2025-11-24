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

    orders.forEach(order => {
      if (!order.plan?.end_date) return
      const dbEndDate = new Date(order.plan.end_date)
      const orderDate = new Date(order.created_at)
      let effectiveEndDate = dbEndDate

      // Logic to distinguish between current cycle orders and past cycle orders
      if (dbEndDate.getTime() < now.getTime()) {
        // Case A: Plan is expired in DB (Virtual Mode)
        // If order was created AFTER the plan expired, it's a "virtual" order -> 15 days from creation
        if (orderDate.getTime() > dbEndDate.getTime()) {
          effectiveEndDate = new Date(orderDate.getTime() + 15 * 24 * 60 * 60 * 1000)
        }
        // Else: Order was created BEFORE plan expired -> It is truly expired (use dbEndDate)
      } else {
        // Case B: Plan is active in DB (Date was likely updated/extended)
        // Check if this order belongs to the current cycle or a previous one.
        // Heuristic: If order is older than 25 days relative to the new end date, it's likely from a previous cycle.
        // (Assuming a standard cycle is ~15 days, 25 days gives a safe buffer)
        const diffTime = dbEndDate.getTime() - orderDate.getTime()
        const diffDays = diffTime / (1000 * 60 * 60 * 24)

        if (diffDays > 25) {
          // Old order from previous cycle -> Treat as expired
          // We estimate its original expiry was ~15 days after creation
          effectiveEndDate = new Date(orderDate.getTime() + 15 * 24 * 60 * 60 * 1000)
        }
        // Else: Order is recent enough -> Use the new dbEndDate
      }

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
