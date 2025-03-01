import { client } from './sanity'

export async function checkEnrollment(userId: string, courseId: string) {
  // First get the user's Sanity document ID
  const userDoc = await client.fetch(
    `*[_type == "userProfile" && firebaseUID == $userId][0]._id`,
    { userId }
  )

  if (!userDoc) {
    console.log('User document not found')
    return null
  }

  // Then check for enrollment using the Sanity document ID
  const enrollment = await client.fetch(`
    *[_type == "enrollment" && student._ref == $userDoc && course._ref == $courseId][0].status
  `, { userDoc, courseId })

  console.log('Enrollment query result:', enrollment)
  return enrollment || null
} 