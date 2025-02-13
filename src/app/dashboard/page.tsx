'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserProfile } from '@/lib/user'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import Link from 'next/link'
import { client } from '@/lib/sanity'

async function getUserCourses(userId: string) {
  // First get the user's enrolled courses
  const userDoc = await client.fetch(`
    *[_type == "userProfile" && firebaseUID == $userId][0] {
      "enrolledCourses": enrolledCourses[]-> {
        _id,
        title,
        description,
        courseImage,
        progress
      }
    }
  `, { userId })

  // Then get all available courses
  const allCourses = await client.fetch(`
    *[_type == "course"] {
      _id,
      title,
      description,
      courseImage
    }
  `)

  // Filter out enrolled courses from available courses
  const enrolledIds = userDoc?.enrolledCourses?.map((course: { _id: string }) => course._id) || []
  const availableCourses = allCourses.filter((course: { _id: string }) => !enrolledIds.includes(course._id))

  return {
    enrolledCourses: userDoc?.enrolledCourses || [],
    availableCourses
  }
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [availableCourses, setAvailableCourses] = useState<any[]>([])
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      if (user?.uid) {
        try {
          // Check if this is a new user creation
          const isNewUser = sessionStorage.getItem('newUserCreation')
          
          if (isNewUser) {
            // For new users, wait a bit longer for the first fetch
            await new Promise(resolve => setTimeout(resolve, 2000))
            sessionStorage.removeItem('newUserCreation')
          }

          let profile = null
          let attempts = 0
          const maxAttempts = 3

          while (!profile && attempts < maxAttempts) {
            profile = await getUserProfile(user.uid)
            if (!profile) {
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
            attempts++
          }

          if (profile) {
            setProfile(profile)
          } else {
            setError('Unable to load profile')
          }
        } catch (error) {
          console.error('Error loading profile:', error)
        } finally {
          setLoadingProfile(false)
        }
      }
    }

    if (!loading) {
      if (!user) {
        router.replace('/auth/login')
      } else {
        loadProfile()
      }
    }
  }, [user, loading, router])

  useEffect(() => {
    async function loadCourses() {
      if (user?.uid) {
        try {
          const courses = await getUserCourses(user.uid)
          setEnrolledCourses(courses.enrolledCourses)
          setAvailableCourses(courses.availableCourses)
        } catch (error) {
          console.error('Error loading courses:', error)
        } finally {
          setLoadingCourses(false)
        }
      }
    }

    if (!loading) {
      if (!user) {
        router.replace('/auth/login')
      } else {
        loadCourses()
      }
    }
  }, [user, loading, router])

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId)
    try {
      // First get the user's Sanity document ID
      const userProfile = await getUserProfile(user!.uid)
      if (!userProfile?._id) {
        throw new Error('User profile not found')
      }

      // Now patch the correct document using its Sanity _id
      await client
        .patch(userProfile._id) // Use the Sanity document ID, not Firebase UID
        .setIfMissing({ enrolledCourses: [] })
        .append('enrolledCourses', [{ _ref: courseId, _type: 'reference' }])
        .commit()

      // Refresh the courses lists
      const courses = await getUserCourses(user!.uid)
      setEnrolledCourses(courses.enrolledCourses)
      setAvailableCourses(courses.availableCourses)
    } catch (error) {
      console.error('Error enrolling in course:', error)
    } finally {
      setEnrolling(null)
    }
  }

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">
            {retryCount > 0 ? 'Finalizing your account...' : 'Loading...'}
          </h2>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading profile</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {profile?.name || 'Student'}!
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Continue your learning journey
          </p>
        </div>

        {/* Enrolled Courses Section */}
        <div className="mb-12">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6">Your Courses</h2>
          {loadingCourses ? (
            <div className="text-center py-8">
              <p>Loading your courses...</p>
            </div>
          ) : enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <div 
                  key={course._id} 
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  {/* Course Image */}
                  <div className="relative h-48 w-full">
                    {course.courseImage ? (
                      <Image
                        src={urlFor(course.courseImage).url()}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {course.description}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-indigo-600 h-2.5 rounded-full" 
                          style={{ width: `${course.progress || 0}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {course.progress || 0}% Complete
                      </p>
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/learn/${course._id}`}
                      className="block w-full text-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                    >
                      Continue Learning
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow-sm">
              <p className="text-gray-600">You haven&apos;t enrolled in any courses yet.</p>
              <Link 
                href="/courses" 
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-700"
              >
                Browse Courses
              </Link>
            </div>
          )}
        </div>

        {/* Available Courses Section */}
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold mb-6">Available Courses</h2>
          {loadingCourses ? (
            <div className="text-center py-8">
              <p>Loading courses...</p>
            </div>
          ) : availableCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.map((course) => (
                <div 
                  key={course._id} 
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  {/* Course Image */}
                  <div className="relative h-48 w-full">
                    {course.courseImage ? (
                      <Image
                        src={urlFor(course.courseImage).url()}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {course.description}
                    </p>

                    {/* Action Button */}
                    <button
                      onClick={() => handleEnroll(course._id)}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50"
                      disabled={enrolling === course._id}
                    >
                      {enrolling === course._id ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow-sm">
              <p className="text-gray-600">No courses available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

