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
    // Add more detailed logging
    console.log('Attempting to create Sanity profile for:', userData.email)
    
    const result = await client.create({
      _type: 'userProfile',
      firebaseUID: userData.firebaseUID,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      enrolledCourses: []
    })
    
    console.log('Sanity profile created successfully:', result)
    return result
  } catch (error) {
    // More detailed error logging
    console.error('Failed to create Sanity profile:', {
      error,
      userData: { ...userData, firebaseUID: '***' } // Hide sensitive data
    })
    
    throw new Error(`Failed to create Sanity profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
} 