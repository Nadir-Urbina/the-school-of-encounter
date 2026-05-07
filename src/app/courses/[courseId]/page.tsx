'use client'
import { useEffect, useState, use } from 'react'
import { client, urlFor } from '@/lib/sanity'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { loadStripe } from '@stripe/stripe-js'
import { useRouter } from 'next/navigation'
import { checkEnrollment } from '@/lib/enrollment'

interface Course {
  _id: string
  title: string
  courseImage: {
    _type: string
    asset: {
      _ref: string
      _type: string
    }
  }
  description: string
  modules: Array<{
    _id: string
    title: string
    lessons: Array<{
      _id: string
      title: string
      videoId: string
    }>
  }>
  price?: number
  studentCount?: number
  completionRate?: number
  averageRating?: number
  instructors: Array<{
    _id: string
    name: string
    image: any
  }>
  publishedAt?: string
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

type EnrollmentStatus = 'active' | 'pending' | 'completed' | null;

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function CoursePreviewPage({
  params
}: {
  params: Promise<{ courseId: string }>
}) {
  const resolvedParams = use(params)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrollmentLoading, setEnrollmentLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>(null)

  useEffect(() => {
    async function loadCourse() {
      try {
        const courseData = await client.fetch(`
          *[_type == "course" && slug.current == $courseId][0] {
            _id,
            title,
            courseImage,
            description,
            price,
            studentCount,
            averageRating,
            "instructors": instructors[]-> {
              _id,
              name,
              image
            },
            "modules": modules[]-> {
              _id,
              title,
              "lessons": lessons[]-> {
                _id,
                title,
                videoId
              }
            },
            publishedAt
          }
        `, { courseId: resolvedParams.courseId })

        setCourse(courseData)
      } catch (error) {
        console.error('Error loading course:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [resolvedParams.courseId])

  useEffect(() => {
    async function checkUserEnrollment() {
      if (user?.uid && course?._id) {
        setEnrollmentLoading(true)
        try {
          console.log('Checking enrollment for:', {
            userId: user.uid,
            courseId: course._id
          })
          const status = await checkEnrollment(user.uid, course._id)
          console.log('Enrollment status:', status)
          setEnrollmentStatus(status)
        } catch (error) {
          console.error('Error checking enrollment:', error)
        } finally {
          setEnrollmentLoading(false)
        }
      }
    }

    checkUserEnrollment()
  }, [user, course])

  const handleEnroll = async () => {
    if (!user) {
      window.location.href = `/auth/login?redirect=/courses/${resolvedParams.courseId}`
      return
    }
    
    // Check if the course is not yet published
    if (isComingSoon(course?.publishedAt)) {
      return; // Don't allow enrollment for unreleased courses
    }

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: course?._id,
          userId: user.uid,
          email: user.email,
          price: course?.price,
          title: course?.title
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
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading course details...</h2>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Course not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/courses"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Courses
          </Link>
        </div>

        {/* Course Overview Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Course Header with Image */}
          <div className="relative h-48 sm:h-64">
            {course.courseImage && (
              <Image
                src={urlFor(course.courseImage).url()}
                alt={course.title}
                fill
                className="object-cover"
              />
            )}
          </div>

          {/* Course Header Content */}
          <div className="p-6 sm:p-8 border-b">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  {course.title}
                </h1>
                <p className="text-gray-600 text-sm sm:text-base mb-4">
                  {course.description}
                </p>
                {course.instructors && (
                  <div className="flex items-center space-x-4">
                    {course.instructors.map(instructor => (
                      <div key={instructor._id} className="flex items-center">
                        {instructor.image && (
                          <Image
                            src={urlFor(instructor.image).width(40).height(40).url()}
                            alt={instructor.name}
                            width={40}
                            height={40}
                            className="rounded-full mr-2"
                          />
                        )}
                        <span className="text-gray-700">{instructor.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-center">
                {course.price && (
                  <div className="text-3xl font-bold text-gray-900 mb-4">
                    ${course.price}
                  </div>
                )}
                {isComingSoon(course?.publishedAt) && (
                  <div className="mb-4">
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                      Coming Soon
                    </span>
                  </div>
                )}
                {enrollmentLoading ? (
                  <Button disabled className="w-full bg-gray-400 text-white cursor-not-allowed">
                    Checking enrollment...
                  </Button>
                ) : enrollmentStatus === 'active' ? (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => router.push(`/learn/${resolvedParams.courseId}`)}
                  >
                    Continue Learning
                  </Button>
                ) : enrollmentStatus === 'pending' ? (
                  <Button 
                    disabled
                    className="w-full bg-yellow-600 text-white cursor-not-allowed"
                  >
                    Enrollment Pending
                  </Button>
                ) : isComingSoon(course?.publishedAt) ? (
                  <Button 
                    disabled
                    className="w-full bg-gray-400 text-gray-800 cursor-not-allowed"
                  >
                    Available on {formatDate(course?.publishedAt)}
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleEnroll}
                  >
                    {user ? `Enroll for $${course.price}` : 'Sign in to Enroll'}
                  </Button>
                )}
                {enrollmentStatus === 'active' && (
                  <p className="mt-2 text-sm text-green-600">
                    You are enrolled in this course
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 sm:p-8 bg-gray-50">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Students</p>
              <p className="text-2xl font-semibold">{course.studentCount || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Modules</p>
              <p className="text-2xl font-semibold">{course.modules?.length || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Average Rating</p>
              <p className="text-2xl font-semibold">{course.averageRating?.toFixed(1) || 'N/A'}</p>
            </div>
          </div>

          {/* Course Content */}
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-6">Course Content</h2>
            <div className="space-y-6">
              {course.modules?.map((module) => (
                <div
                  key={module._id}
                  className="bg-white border rounded-lg overflow-hidden"
                >
                  <div className="p-4 sm:p-6 border-b bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-900">
                      {module.title}
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    <ul className="space-y-3">
                      {module.lessons?.map((lesson) => (
                        <li
                          key={lesson._id}
                          className="flex items-center text-sm sm:text-base text-gray-600"
                        >
                          <span className="mr-3">•</span>
                          {lesson.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 