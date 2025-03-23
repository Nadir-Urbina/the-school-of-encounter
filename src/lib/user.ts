import { client } from '@/lib/sanity'

export async function createOrUpdateUserProfile(userData: {
  firebaseUID: string
  email: string
  name: string
  role?: string
}) {
  // Check if user profile exists
  const existingProfile = await client.fetch(
    `*[_type == "userProfile" && firebaseUID == $uid][0]`,
    { uid: userData.firebaseUID }
  )

  if (existingProfile) {
    // Update existing profile
    return client.patch(existingProfile._id).set({
      name: userData.name,
      email: userData.email,
      role: userData.role || existingProfile.role || 'student' // Default to student
    }).commit()
  } else {
    // Create new profile
    return client.create({
      _type: 'userProfile',
      firebaseUID: userData.firebaseUID,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'student',
      enrolledCourses: []
    })
  }
}

export async function getUserProfile(firebaseUID: string) {
  try {
    console.log('Fetching profile for Firebase UID:', firebaseUID)
    const profile = await client.fetch(`
      *[_type == "userProfile" && firebaseUID == $uid][0] {
        _id,
        firebaseUID,
        name,
        email,
        role,
        bio,
        avatar,
        "enrolledCourses": enrolledCourses[]-> {
          _id,
          title,
          description,
          courseImage
        }
      }
    `, { uid: firebaseUID })

    console.log('Profile found:', profile)
    return profile
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    throw error
  }
}

export async function updateUserBio(firebaseUID: string, bio: string) {
  try {
    console.log('Updating bio for Firebase UID:', firebaseUID)
    
    // First, get the user profile to get the Sanity document ID
    const profile = await client.fetch(`
      *[_type == "userProfile" && firebaseUID == $uid][0] {
        _id
      }
    `, { uid: firebaseUID })
    
    if (!profile || !profile._id) {
      throw new Error('User profile not found')
    }
    
    // Update the bio
    const result = await client
      .patch(profile._id)
      .set({ bio })
      .commit()
    
    console.log('Bio updated successfully:', result)
    return result
  } catch (error) {
    console.error('Error updating user bio:', error)
    throw error
  }
} 