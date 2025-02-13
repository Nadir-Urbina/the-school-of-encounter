'use server'

import { createClient } from 'next-sanity'

// Create a new client specifically for the server action
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false
})

export async function createSanityUserProfile(userData: {
  firebaseUID: string
  email: string
  name: string
  role: string
}) {
  if (!process.env.SANITY_TOKEN) {
    throw new Error('Sanity token is not configured')
  }

  try {
    // First check if user already exists
    const existingUser = await client.fetch(
      `*[_type == "userProfile" && firebaseUID == $uid][0]`,
      { uid: userData.firebaseUID }
    )

    if (existingUser) {
      console.log('User profile already exists:', existingUser._id)
      return existingUser
    }

    // Add more detailed logging
    console.log('Creating new Sanity profile for:', userData.email)
    
    // Verify all required fields are present
    if (!userData.firebaseUID || !userData.email || !userData.name) {
      throw new Error('Missing required user data')
    }

    const result = await client.create({
      _type: 'userProfile',
      firebaseUID: userData.firebaseUID,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'student',
      enrolledCourses: []
    })
    
    console.log('Sanity profile created successfully:', result)
    return result
  } catch (error) {
    // More detailed error logging
    console.error('Failed to create Sanity profile:', {
      error,
      userData: { 
        ...userData, 
        firebaseUID: '***' // Hide sensitive data
      }
    })

    if (error instanceof Error) {
      // Check for specific Sanity errors
      if (error.message.includes('token')) {
        throw new Error('Authentication error with Sanity')
      }
      if (error.message.includes('validation')) {
        throw new Error('Invalid user data format')
      }
      throw new Error(`Sanity profile creation failed: ${error.message}`)
    }
    
    throw new Error('Unknown error creating Sanity profile')
  }
} 