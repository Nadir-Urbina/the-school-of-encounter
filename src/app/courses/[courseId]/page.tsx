'use client'
import { useEffect, useState, use } from 'react'
import { client, urlFor } from '@/lib/sanity'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

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
}

export default function CoursePreviewPage({
  params
}: {
  params: Promise<{ courseId: string }>
}) {
  const resolvedParams = use(params)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

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
            }
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

  const handleEnroll = async () => {
    if (!user) {
      // Redirect to login if user is not authenticated
      window.location.href = `/auth/login?redirect=/courses/${resolvedParams.courseId}`
      return
    }
    // Add enrollment logic here
    console.log('Enrolling in course:', course?._id)
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
            <div className="flex justify-between items-start">
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
                <Button 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={handleEnroll}
                >
                  {user ? 'Enroll Now' : 'Sign in to Enroll'}
                </Button>
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