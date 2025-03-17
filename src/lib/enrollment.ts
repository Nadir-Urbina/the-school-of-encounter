import { client } from '@/lib/sanity'

export async function checkEnrollment(userId: string, courseId: string): Promise<'active' | 'pending' | 'completed' | null> {
  try {
    // First get the user's Sanity ID
    const userDoc = await client.fetch(`
      *[_type == "userProfile" && firebaseUID == $userId][0]._id
    `, { userId })

    if (!userDoc) {
      return null
    }

    // Then check if there's an enrollment
    const enrollment = await client.fetch(`
      *[_type == "enrollment" && student._ref == $userDocId && course._ref == $courseId][0] {
        status
      }
    `, { userDocId: userDoc, courseId })

    return enrollment ? enrollment.status : null
  } catch (error) {
    console.error('Error checking enrollment:', error)
    return null
  }
} 