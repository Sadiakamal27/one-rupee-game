import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function POST() {
    try {
        const supabase = createClient()

        // Call the database function to check and reset expired plans
        const { data, error } = await supabase.rpc('check_and_reset_expired_plans')

        if (error) {
            console.error('Error resetting plans:', error)
            return NextResponse.json(
                { error: 'Failed to reset plans', details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Plans checked and reset successfully',
            resetPlans: data || []
        })
    } catch (err: any) {
        console.error('Unexpected error:', err)
        return NextResponse.json(
            { error: 'Unexpected error occurred', details: err.message },
            { status: 500 }
        )
    }
}

// Allow GET for easy testing
export async function GET() {
    return POST()
}
