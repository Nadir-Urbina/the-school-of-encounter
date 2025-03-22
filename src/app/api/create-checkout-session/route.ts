import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { serverClient } from '@/lib/sanity'

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia', // Use the latest API version
})

export async function POST(request: Request) {
  try {
    const { courseId, userId, email, price, title } = await request.json()

    // Validate required fields
    if (!courseId || !userId || !email || !price || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: title,
              description: `Enrollment for ${title}`,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      allow_promotion_codes: true, // Enable promotion code field in Stripe checkout
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment-success?session_id={CHECKOUT_SESSION_ID}&courseId=${courseId}&userId=${userId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/courses/${courseId}`,
      customer_email: email,
      metadata: {
        courseId,
        userId,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
