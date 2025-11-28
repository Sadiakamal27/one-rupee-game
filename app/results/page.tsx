'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GamePlan } from '@/types/database'
import { Caveat } from 'next/font/google'
import Link from 'next/link'
import { Trophy, Home } from 'lucide-react'

const caveat = Caveat({
    weight: ['400', '600', '700'],
    subsets: ['latin'],
    variable: '--font-caveat',
})

// Image mapping configuration (same as GamePlans)
const PLAN_IMAGES: Record<string, string> = {
    'iphone': '/iphone.jpg',
    'trip': '/trip.jpg',
    'cash': '/cash.jpg',
    'money': '/cash.jpg',
    'bike': '/bike.jpg',
    'motorcycle': '/bike.jpg',
    'car': '/car.jpg',
    'laptop': '/laptop.jpg',
    'macbook': '/laptop.jpg',
    'camera': '/camera.jpg',
    '17 pro max': '/iphone.jpg',
    'pro max': '/iphone.jpg',
    'default': '/globe.svg'
};

const getPlanImage = (title: string) => {
    const lowerTitle = title.toLowerCase();
    // Check for keyword inclusion
    for (const [key, path] of Object.entries(PLAN_IMAGES)) {
        if (key !== 'default' && lowerTitle.includes(key)) {
            return path;
        }
    }
    return PLAN_IMAGES['default'];
};

export default function ResultsPage() {
    const [plans, setPlans] = useState<GamePlan[]>([])
    const [timeLeft, setTimeLeft] = useState<Record<number, string>>({})
    const [effectiveEndDates, setEffectiveEndDates] = useState<Record<number, Date>>({})
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

    // Calculate effective end dates when plans change (not every second)
    useEffect(() => {
        if (plans.length === 0) return
        const now = new Date()
        const effectiveDates: Record<number, Date> = {}

        plans.forEach(plan => {
            // End date handling (ensure 15 days window visual; if no end_date or ended, derive one)
            let endDate = plan.end_date ? new Date(plan.end_date) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)

            // If end_date is in the past, extend it by 15 days from now
            // This only happens when plans are loaded/updated, not every second
            if (endDate.getTime() < now.getTime()) {
                endDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
            }

            // Check if date is valid
            if (!isNaN(endDate.getTime())) {
                effectiveDates[plan.id] = endDate
            }
        })
        setEffectiveEndDates(effectiveDates)
    }, [plans])

    const updateTimers = useCallback(() => {
        if (plans.length === 0 || Object.keys(effectiveEndDates).length === 0) return
        const now = new Date()
        const timers: Record<number, string> = {}

        plans.forEach(plan => {
            const endDate = effectiveEndDates[plan.id]
            if (!endDate) return

            const msLeft = endDate.getTime() - now.getTime()

            if (msLeft > 0) {
                // Calculate days, hours, minutes, and seconds
                const days = Math.floor(msLeft / (1000 * 60 * 60 * 24))
                const hours = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((msLeft % (1000 * 60)) / 1000)

                // Show DDd:HHh:MMm:SSs format with labels
                const formatted = `${String(days).padStart(2, '0')}d:${String(hours).padStart(2, '0')}h:${String(minutes).padStart(2, '0')}m:${String(seconds).padStart(2, '0')}s`
                timers[plan.id] = formatted
            } else {
                // This should rarely happen now, but handle edge case
                timers[plan.id] = '00d:00h:00m:00s'
            }
        })
        setTimeLeft(timers)
    }, [plans, effectiveEndDates])

    useEffect(() => {
        fetchPlans()
    }, [])

    useEffect(() => {
        const interval = setInterval(() => {
            updateTimers()
        }, 1000)
        updateTimers()
        return () => clearInterval(interval)
    }, [updateTimers])

    // Show all plans (filtering by 2 days will be added later)
    const plansWithTimer = plans

    return (
        <div className={`min-h-screen bg-white p-4 ${caveat.variable}`}>
            <div className="max-w-6xl mx-auto">

                <h2 className="text-2xl font-bold mb-6">Results</h2>

                <div className="space-y-0">

                    {plansWithTimer.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No plans available
                        </div>
                    ) : (
                        plansWithTimer.map((plan) => {
                            const timerText = timeLeft[plan.id];

                            // Display time - already formatted as HH:MM
                            const displayTime = timerText || "00:00";

                            // Calculate color transition from green (0%) to red (100%)
                            // Based on time remaining: 2 days = 0% (green), 0 days = 100% (red)
                            const now = new Date();
                            const endDate = effectiveEndDates[plan.id];

                            if (!endDate) {
                                return null;
                            }

                            const msLeft = endDate.getTime() - now.getTime();
                            const daysLeft = msLeft / (1000 * 60 * 60 * 24);

                            // Progress: 0 when 2 days left (green), 1 when 0 days left (red)
                            // For plans with more than 2 days, keep them green
                            // Only calculate progress if time is remaining
                            let progress = 0;
                            if (msLeft > 0) {
                                progress = daysLeft > 2 ? 0 : Math.max(0, Math.min(1, 1 - (daysLeft / 2)));
                            } else {
                                // Expired - show red
                                progress = 1;
                            }

                            // RGB: green (0,255,0) to red (255,0,0)
                            const red = Math.floor(255 * progress);
                            const green = Math.floor(255 * (1 - progress));
                            const color = `rgb(${red}, ${green}, 0)`;

                            return (
                                <div
                                    key={plan.id}
                                    className="flex items-center justify-between py-4 border-b border-gray-200"
                                >
                                    {/* LEFT: IMAGE AND TITLE */}
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 h-24 sm:w-28 sm:h-28 relative rounded-lg overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                                            <img
                                                src={plan.image_url || getPlanImage(plan.reward_title)}
                                                alt={plan.reward_title}
                                                className="object-contain w-full h-full p-2"
                                            />
                                        </div>
                                        <div className="text-xl sm:text-3xl font-medium text-gray-700">
                                            {plan.reward_title}
                                        </div>
                                    </div>

                                    {/* RIGHT: TIMER */}
                                    <div className="flex flex-col items-end">
                                        <div
                                            className="text-5xl font-bold transition-colors duration-500"
                                            style={{
                                                fontFamily: "var(--font-caveat), cursive",
                                                color: color
                                            }}
                                        >
                                            {displayTime}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                </div>

                {/* Footer - Action Buttons */}
                <div className="mt-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">

                        {/* Join Insta Live Button */}
                        <Link
                            href="https://www.instagram.com/onerupee.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-pink-600 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
                                {/* Broadcast signal waves */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="absolute w-10 h-10 border-2 border-white rounded-full opacity-50"></div>
                                    <div className="absolute w-6 h-6 border-2 border-white rounded-full opacity-70"></div>
                                </div>
                                <span className="text-white font-bold text-xs sm:text-sm relative z-10">LIVE</span>
                            </div>
                            <span className="text-gray-700 font-medium text-xs sm:text-sm">Join Insta Live</span>
                        </Link>

                        {/* See Winners Button */}
                        <Link
                            href="/results"
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-red-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-dashed border-red-700">
                                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                            </div>
                            <span className="text-gray-700 font-medium text-xs sm:text-sm">See Winners</span>
                        </Link>

                        {/* Home Button */}
                        <Link
                            href="/"
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-green-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                <Home className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                            </div>
                            <span className="text-gray-700 font-medium text-xs sm:text-sm">Home</span>
                        </Link>

                    </div>
                </div>


            </div>
        </div>
    );

}
