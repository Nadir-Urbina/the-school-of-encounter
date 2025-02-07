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
  return client.fetch(`
    *[_type == "userProfile" && firebaseUID == $uid][0] {
      _id,
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
} 