'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, GamePlan } from '@/types/database'
import Link from 'next/link'

export default function OrdersPage() {
  const [orders, setOrders] = useState<(Order & { plan?: GamePlan })[]>([])
  const [loading, setLoading] = useState(true)
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
        plan:game_plans(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
    } else {
      setOrders(data || [])
    }
    setLoading(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-white p-4">
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
              <div className="p-8 text-center text-gray-500">
                No orders yet
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-4 gap-4 p-4 border-b border-gray-300 hover:bg-gray-50"
                >
                  <div className="font-mono">{order.order_id || order.id}</div>
                  <div>{order.name}</div>
                  <div>Rs{order.amount} - {order.plan?.reward_title || 'N/A'}</div>
                  <div>{order.plan ? formatDate(order.plan.end_date) : 'N/A'}</div>
                </div>
              ))
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

