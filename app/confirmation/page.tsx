'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [displayOrderId, setDisplayOrderId] = useState(orderId || '')

  useEffect(() => {
    if (orderId) {
      setDisplayOrderId(orderId)
    }
  }, [orderId])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full border-2 border-black rounded-lg p-8 text-center">
        {/* Header */}
        <h1 className="text-3xl font-bold text-red-600 mb-8" style={{ fontFamily: 'cursive' }}>
          OneRupeeGame
        </h1>

        {/* Confirmation Message */}
        <div className="mb-8">
          <p className="text-2xl font-bold mb-4">Thank you</p>
          <p className="text-lg mb-2">Your Order Id is</p>
          <p className="text-3xl font-bold text-green-600">{displayOrderId}</p>
        </div>

        {/* Back to Home Button */}
        <Link
          href="/"
          className="inline-block bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          Back to Home
        </Link>

        {/* Ad Section */}
        <div className="mt-8 border-2 border-red-500 rounded-lg p-6">
          <p className="text-red-500 text-xl font-bold" style={{ fontFamily: 'cursive' }}>
            Ad
          </p>
        </div>
      </div>
    </div>
  )
}

