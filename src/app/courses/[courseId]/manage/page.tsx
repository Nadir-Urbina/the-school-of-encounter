'use client'
import { useEffect, useState, use } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { client } from '@/lib/sanity'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import Link from 'next/link'

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
  studentCount?: number
  completionRate?: number
  averageRating?: number
}

export default function CourseManagePage({ 
  params 
}: { 
  params: Promise<{ courseId: string }> 
}) {
  const resolvedParams = use(params)
  const courseId = resolvedParams.courseId
  const { user, loading } = useAuth()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [loadingCourse, setLoadingCourse] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }

    async function loadCourse() {
      try {
        const courseData = await client.fetch(`
          *[_type == "course" && _id == $courseId][0] {
            _id,
            title,
            courseImage,
            description,
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
        setLoadingCourse(false)
      }
    }

    loadCourse()
  }, [resolvedParams.courseId, user, loading, router])

  if (loading || loadingCourse) {
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
            href="/teacher-dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Course Overview Card */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Course Header */}
          <div className="p-6 sm:p-8 border-b">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              {course?.title}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {course?.description}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-6 sm:p-8 bg-gray-50">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Students</p>
              <p className="text-2xl font-semibold">{course?.studentCount || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Completion Rate</p>
              <p className="text-2xl font-semibold">{course?.completionRate || 0}%</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Modules</p>
              <p className="text-2xl font-semibold">{course?.modules?.length || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Lessons</p>
              <p className="text-2xl font-semibold">{course?.modules?.reduce((total, module) => total + module.lessons.length, 0) || 0}</p>
            </div>
          </div>

          {/* Course Content */}
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-6">Course Content</h2>
            <div className="space-y-6">
              {course?.modules?.map((module) => (
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