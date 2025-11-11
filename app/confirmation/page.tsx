'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

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
      <Link
        href="https://blog.hubspot.com/website/landscaper-websites" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block"
      >
        <div className="relative max-w-7xl mx-auto border-2 border-red-500 rounded-lg overflow-hidden h-34 mt-2">
          <Image
            src="/gamead.webp" 
            alt="Advertisement"
            fill
            className="object-fill"
          />
        </div>
      </Link>
      </div>
    </div>
  )
}

