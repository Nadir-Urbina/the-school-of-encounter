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
  courseImage: any
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
  const { user, loading } = useAuth()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [loadingCourse, setLoadingCourse] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user || user.role !== 'teacher') {
      router.replace('/dashboard')
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
  }, [user, loading, router, resolvedParams.courseId])

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/teacher-dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Course Header */}
          <div className="relative h-48 rounded-t-lg overflow-hidden">
            {course.courseImage && (
              <Image
                src={urlFor(course.courseImage).url()}
                alt={course.title}
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end">
              <div className="p-6">
                <h1 className="text-2xl font-bold text-white">{course.title}</h1>
              </div>
            </div>
          </div>

          {/* Course Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
            <div className="bg-gray-50 p-4 rounded-lg shadow">
              <h4 className="text-gray-500 text-sm">Total Students</h4>
              <p className="text-2xl font-semibold">{course.studentCount || 0}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow">
              <h4 className="text-gray-500 text-sm">Completion Rate</h4>
              <p className="text-2xl font-semibold">{course.completionRate || 0}%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow">
              <h4 className="text-gray-500 text-sm">Average Rating</h4>
              <p className="text-2xl font-semibold">{course.averageRating || '-'}/5</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg shadow">
              <h4 className="text-gray-500 text-sm">Total Modules</h4>
              <p className="text-2xl font-semibold">{course.modules?.length || 0}</p>
            </div>
          </div>

          {/* Course Content */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Course Content</h2>
            <div className="space-y-4">
              {course.modules?.map((module) => (
                <div key={module._id} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">{module.title}</h3>
                  <div className="pl-4 space-y-1">
                    {module.lessons?.map((lesson) => (
                      <div key={lesson._id} className="text-sm text-gray-600">
                        • {lesson.title}
                      </div>
                    ))}
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