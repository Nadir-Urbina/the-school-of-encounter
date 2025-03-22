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

// Create an enrollment record
export async function createEnrollment(userId: string, courseId: string) {
  return client.create({
    _type: 'enrollment',
    student: {
      _type: 'reference',
      _ref: userId
    },
    course: {
      _type: 'reference',
      _ref: courseId
    },
    enrollmentDate: new Date().toISOString()
  })
}

// Check if user is enrolled in a course
export async function isUserEnrolled(firebaseUid: string, courseId: string): Promise<boolean> {
  try {
    console.log('isUserEnrolled function called with:', { firebaseUid, courseId });
    
    // Get both the user profile ID and check enrollment in one query for efficiency
    const query = `{
      "userProfile": *[_type == "userProfile" && firebaseUID == $firebaseUid][0] {_id},
      "enrollment": *[_type == "enrollment" && 
                      references(*[_type == "userProfile" && firebaseUID == $firebaseUid][0]._id) && 
                      references($courseId)][0]
    }`
    
    console.log('Executing combined query:', query);
    const result = await client.fetch(query, { firebaseUid, courseId })
    console.log('Combined query result:', result);
    
    // If we have an enrollment, return true
    return !!result.enrollment;
  } catch (error) {
    console.error('Error checking enrollment:', error)
    return false
  }
}

// Get all courses a user is enrolled in
export async function getUserEnrollments(userId: string) {
  const query = `
    *[_type == "enrollment" && student._ref == $userId]{
      _id,
      enrollmentDate,
      "course": course->{
        _id,
        title,
        description,
        slug,
        courseImage
      }
    }
  `
  return client.fetch(query, { userId })
} 