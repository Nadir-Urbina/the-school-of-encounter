import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { serverClient } from '@/lib/sanity'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  console.log('Webhook received')
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature') ?? ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new NextResponse(
      JSON.stringify({ error: 'Webhook signature verification failed' }),
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { courseId, userId } = session.metadata!

    console.log('Processing enrollment for:', { courseId, userId })

    try {
      // First fetch the user's Sanity document ID
      const userDoc = await serverClient.fetch(
        `*[_type == "userProfile" && firebaseUID == $uid][0]._id`,
        { uid: userId }
      )

      if (!userDoc) {
        throw new Error('User not found in Sanity')
      }

      // Create new enrollment document with the correct Sanity user ID
      const enrollment = await serverClient.create({
        _type: 'enrollment',
        student: {
          _type: 'reference',
          _ref: userDoc // Use Sanity document ID instead of Firebase UID
        },
        course: {
          _type: 'reference',
          _ref: courseId
        },
        enrolledAt: new Date().toISOString(),
        status: 'active'
      })

      console.log('Successfully created enrollment:', enrollment)
    } catch (error) {
      // More detailed error logging
      console.error('Full error object:', error)
      console.error('Error details:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error,
        courseId,
        userId,
        sessionId: session.id
      })
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'Error updating enrollment',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }
  }

  console.log('Webhook processed successfully')
  return new NextResponse(
    JSON.stringify({ received: true }),
    { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    }
  )
} 