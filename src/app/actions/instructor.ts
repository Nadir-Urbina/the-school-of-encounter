'use server'

import { createClient } from 'next-sanity'

// Create a write-enabled Sanity client for server actions
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
})

/**
 * Updates an instructor's bio
 */
export async function updateInstructorBio(instructorId: string, bio: string) {
  if (!process.env.SANITY_API_TOKEN) {
    throw new Error('Sanity token is not configured')
  }

  try {
    // Apply the mutation to update the bio
    const result = await client
      .patch(instructorId)
      .set({ bio })
      .commit()
    
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to update instructor bio:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Uploads an image to Sanity and updates the instructor's profile
 */
export async function updateInstructorImage(
  instructorId: string, 
  imageData: string
) {
  if (!process.env.SANITY_API_TOKEN) {
    throw new Error('Sanity token is not configured')
  }

  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(
      imageData.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    )
    
    // Upload the image to Sanity
    const asset = await client.assets.upload('image', imageBuffer, {
      filename: `instructor_${instructorId}_${Date.now()}.jpg`
    })
    
    // Update the instructor document with the new image
    const result = await client
      .patch(instructorId)
      .set({
        image: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: asset._id
          }
        }
      })
      .commit()
    
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to update instructor image:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
} 