'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { GamePlan } from '@/types/database'
import Link from 'next/link'
import Image from 'next/image'

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planId = searchParams.get('plan')
  const amount = searchParams.get('amount')
  
  const [plan, setPlan] = useState<GamePlan | null>(null)
  const [name, setName] = useState('')
  const [easypaisaAccount, setEasypaisaAccount] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (planId) {
      fetchPlan()
    }
  }, [planId])

  const fetchPlan = async () => {
    const { data, error } = await supabase
      .from('game_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (error) {
      console.error('Error fetching plan:', error)
    } else {
      setPlan(data)
    }
  }

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !easypaisaAccount || !planId) {
      alert('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      // Generate unique order ID
      let orderId: string
      let isUnique = false
      let attempts = 0
      
      while (!isUnique && attempts < 10) {
        orderId = Math.floor(Math.random() * 10000000)
          .toString()
          .padStart(7, '0')
        
        // Check if order_id already exists
        const { data: existing } = await supabase
          .from('orders')
          .select('id')
          .eq('order_id', orderId)
          .single()
        
        if (!existing) {
          isUnique = true
        }
        attempts++
      }
      
      if (!isUnique) {
        // Fallback: use timestamp-based ID
        orderId = Date.now().toString().slice(-7)
      }

      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_id: orderId!,
          name,
          easypaisa_account: easypaisaAccount,
          plan_id: parseInt(planId),
          amount: parseInt(amount || '0'),
          payment_status: 'pending',
        })
        .select()
        .single()

      if (orderError) {
        throw orderError
      }

      // TODO: Integrate Easypaisa API here
      // For now, we'll simulate payment success
      // In production, you'll need to:
      // 1. Call Easypaisa API to initiate payment
      // 2. Handle payment response
      // 3. Update order status based on payment result

      // Simulate payment (remove this in production)
      const paymentSuccess = await initiateEasypaisaPayment(
        parseInt(amount || '0'),
        orderData.id
      )

      if (paymentSuccess) {
        // Update order status to completed
        await supabase
          .from('orders')
          .update({ payment_status: 'completed' })
          .eq('id', orderData.id)

        // Redirect to confirmation page with order_id
        router.push(`/confirmation?orderId=${orderData.order_id}`)
      } else {
        alert('Payment failed. Please try again.')
        setLoading(false)
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  // Placeholder function for Easypaisa integration
  const initiateEasypaisaPayment = async (amount: number, orderId: number): Promise<boolean> => {
    // TODO: Replace with actual Easypaisa API call
    // This is a placeholder that simulates payment
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate payment success
        resolve(true)
      }, 1000)
    })
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full border-2 border-black rounded-lg p-6">
      

        {/* Payment Form */}
        <form onSubmit={handlePayment} className="space-y-4">
          {/* Name Input */}
          <div>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-black rounded-lg px-4 py-3 text-lg"
              required
            />
          </div>

          {/* Easypaisa Account Input */}
          <div>
            <input
              type="text"
              placeholder="Easypaisa Acc no"
              value={easypaisaAccount}
              onChange={(e) => setEasypaisaAccount(e.target.value)}
              className="w-full border-2 border-black rounded-lg px-4 py-3 text-lg"
              required
            />
          </div>

          {/* Payment Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Processing...' : `Pay Rs${amount} (Easypaisa)`}
          </button>
        </form>

        {/* Ad Section */}
      <Link
        href="https://blog.hubspot.com/website/landscaper-websites"  
        target="_blank" 
        rel="noopener noreferrer" 
        className="block"
      >
        <div className="relative max-w-3xl  mt-2 mx-auto border-2 border-red-500 rounded-lg overflow-hidden h-34">
          
          <Image
            src="/gamead.webp" 
            alt="Advertisement"
            fill
            className="object-fill "
          />
        </div>
      </Link>
      </div>
    </div>
  )
}

