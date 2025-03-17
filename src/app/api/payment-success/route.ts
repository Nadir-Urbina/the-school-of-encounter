import { NextResponse, NextRequest } from 'next/server'
import Stripe from 'stripe'
import { serverClient } from '@/lib/sanity'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')
    const courseId = searchParams.get('courseId')
    const userId = searchParams.get('userId')

    if (!sessionId || !courseId || !userId) {
      return NextResponse.redirect(
        new URL('/dashboard?error=missing-params', request.url)
      )
    }

    // Verify the payment was successful
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (session.payment_status !== 'paid') {
      return NextResponse.redirect(
        new URL('/dashboard?error=payment-failed', request.url)
      )
    }

    // Get the user's Sanity document ID
    const userDoc = await serverClient.fetch(
      `*[_type == "userProfile" && firebaseUID == $userId][0]._id`,
      { userId }
    )

    if (!userDoc) {
      return NextResponse.redirect(
        new URL('/dashboard?error=user-not-found', request.url)
      )
    }

    // Check if enrollment already exists
    const existingEnrollment = await serverClient.fetch(
      `*[_type == "enrollment" && student._ref == $userDocId && course._ref == $courseId][0]`,
      { userDocId: userDoc, courseId }
    )

    if (!existingEnrollment) {
      // Create a new enrollment document
      await serverClient.create({
        _type: 'enrollment',
        student: {
          _type: 'reference',
          _ref: userDoc
        },
        course: {
          _type: 'reference',
          _ref: courseId
        },
        enrolledAt: new Date().toISOString(),
        status: 'active'
      })
    }

    // Redirect to dashboard
    return NextResponse.redirect(
      new URL('/dashboard?enrollment=success', request.url)
    )
  } catch (error) {
    console.error('Error processing payment success:', error)
    return NextResponse.redirect(
      new URL('/dashboard?error=server-error', request.url)
    )
  }
} 