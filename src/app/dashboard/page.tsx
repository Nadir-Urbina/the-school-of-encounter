'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserProfile } from '@/lib/user'
import { createSanityUserProfile } from '@/app/actions/user'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import ProfileManagement from '@/components/ProfileManagement'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

async function getUserCourses(userId: string) {
  const response = await fetch(`/api/user-courses?uid=${encodeURIComponent(userId)}`)
  if (!response.ok) return { enrolledCourses: [], availableCourses: [] }
  return response.json()
}

// Helper function to format dates
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  // Format as MM/DD/YYYY
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}

// Helper function to check if a course is not yet published
function isComingSoon(publishedAt: string | undefined): boolean {
  if (!publishedAt) return false;
  
  const now = new Date();
  const publishDate = new Date(publishedAt);
  return publishDate > now;
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
  const [showProfileManagement, setShowProfileManagement] = useState(false)

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
          const maxAttempts = 4

          while (!profile && attempts < maxAttempts) {
            profile = await getUserProfile(user.uid)
            if (!profile) {
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
            attempts++
          }

          // Safety net for Google sign-in: if profile still missing, create it now
          if (!profile && user.email) {
            try {
              await createSanityUserProfile({
                firebaseUID: user.uid,
                name: user.displayName || '',
                email: user.email,
                role: 'student'
              })
              await new Promise(resolve => setTimeout(resolve, 1000))
              profile = await getUserProfile(user.uid)
            } catch {
              // creation also failed; will show error below
            }
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

  const handleEnroll = async (courseId: string, price: number, title: string, publishedAt?: string) => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    // Check if the course is not yet published
    if (isComingSoon(publishedAt)) {
      return; // Don't allow enrollment for unreleased courses
    }

    setEnrolling(courseId)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          userId: user.uid,
          email: user.email,
          price,
          title
        }),
      })

      const { sessionId } = await response.json()
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      const { error } = await stripe!.redirectToCheckout({ sessionId })
      
      if (error) {
        console.error('Error:', error)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setEnrolling(null)
    }
  }

  const handleProfileUpdated = async () => {
    if (user?.uid) {
      try {
        const updatedProfile = await getUserProfile(user.uid)
        if (updatedProfile) {
          setProfile(updatedProfile)
        }
      } catch (error) {
        console.error('Error reloading profile:', error)
      }
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
        {/* User Profile Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          {loadingProfile ? (
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-200 h-16 w-16"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-24 h-24 relative">
                  {profile?.photoURL ? (
                    <Image
                      src={profile.photoURL}
                      alt={profile.name || 'User'}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-indigo-700">
                        {profile?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl font-bold text-gray-900">{profile?.name || user?.email || 'User'}</h1>
                  <p className="text-gray-600">{user?.email}</p>
                  {profile?.bio && (
                    <p className="mt-2 text-gray-700">{profile.bio}</p>
                  )}
                  
                  <button 
                    onClick={() => setShowProfileManagement(!showProfileManagement)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {showProfileManagement ? 'Hide Profile Management' : 'Manage Profile'}
                  </button>
                </div>
              </div>
              
              {showProfileManagement && (
                <div className="mt-8">
                  <ProfileManagement 
                    userProfile={profile} 
                    onProfileUpdated={handleProfileUpdated}
                    onClose={() => setShowProfileManagement(false)}
                  />
                </div>
              )}
            </>
          )}
        </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
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
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 mt-1">
                          {course.progress || 0}% Complete
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {course.completedLessons || 0}/{course.totalLessons || 0} lessons
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link
                      href={`/learn/${course.slug}`}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    {isComingSoon(course.publishedAt) && (
                      <div className="mb-2">
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                          Coming Soon
                        </span>
                      </div>
                    )}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {course.description}
                    </p>

                    {/* Action Button */}
                    <button
                      onClick={() => handleEnroll(course._id, course.price || 0, course.title, course.publishedAt)}
                      className={`w-full py-2 px-4 rounded-md transition-colors duration-200 ${
                        isComingSoon(course.publishedAt) 
                          ? 'bg-gray-400 text-gray-800 cursor-not-allowed' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      } disabled:opacity-50`}
                      disabled={enrolling === course._id || !course.price || isComingSoon(course.publishedAt)}
                    >
                      {enrolling === course._id ? 'Processing...' : 
                       isComingSoon(course.publishedAt) ? `Available on ${formatDate(course.publishedAt)}` :
                       course.price ? `Enroll for $${course.price}` : 'Price unavailable'}
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

