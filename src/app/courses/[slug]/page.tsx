'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import { client } from '@/lib/sanity'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Course {
  _id: string
  title: string
  description: string
  courseImage: any
  modules: Array<{
    _id: string
    title: string
    lessons: Array<{
      _id: string
      title: string
      description: string
      videoUrl?: string
      content?: any
    }>
  }>
}

export default function CoursePage({ params }: { params: { slug: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [loadingCourse, setLoadingCourse] = useState(true)

  useEffect(() => {
    async function loadCourse() {
      try {
        // Fetch course with modules and lessons
        const courseData = await client.fetch(`
          *[_type == "course" && _id == $courseId][0] {
            _id,
            title,
            description,
            courseImage,
            "modules": modules[]-> {
              _id,
              title,
              "lessons": lessons[]-> {
                _id,
                title,
                description,
                videoUrl,
                content
              }
            }
          }
        `, { courseId: params.slug })

        // Also verify enrollment
        if (user?.uid) {
          const userProfile = await client.fetch(`
            *[_type == "userProfile" && firebaseUID == $uid][0] {
              "isEnrolled": count(enrolledCourses[references($courseId)]) > 0
            }
          `, { 
            uid: user.uid,
            courseId: params.slug
          })

          if (!userProfile?.isEnrolled) {
            router.replace('/courses')
            return
          }
        }

        setCourse(courseData)
      } catch (error) {
        console.error('Error loading course:', error)
      } finally {
        setLoadingCourse(false)
      }
    }

    if (!loading) {
      if (!user) {
        router.replace('/auth/login')
      } else {
        loadCourse()
      }
    }
  }, [params.slug, user, loading, router])

  if (loading || loadingCourse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading course...</h2>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Course not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-white bg-black/20 hover:bg-black/30 
                     rounded-lg backdrop-blur-sm transition-colors duration-200"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Hero Section with Course Image */}
      <div className="relative h-[40vh] min-h-[400px]">
        <Image
          src={urlFor(course.courseImage).url()}
          alt={course.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50 flex items-center">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {course.title}
            </h1>
            <p className="text-xl text-gray-200 max-w-2xl">
              {course.description}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Course Overview */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {/* Modules Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6">Course Content</h2>
              <div className="space-y-6">
                {course.modules?.map((module) => (
                  <div key={module._id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                    <h3 className="text-xl font-semibold mb-2">{module.title}</h3>
                    <div className="space-y-2">
                      {module.lessons?.map((lesson) => (
                        <div
                          key={lesson._id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-md cursor-pointer"
                          onClick={() => {
                            // TODO: Implement lesson navigation
                            console.log('Navigate to lesson:', lesson._id)
                          }}
                        >
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {lesson.title}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {lesson.description}
                            </p>
                          </div>
                          {lesson.videoUrl && (
                            <span className="text-blue-600">▶</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 className="text-2xl font-bold mb-6">Enroll Now</h2>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Join this transformative course and start your journey today.
                </p>
                <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg
                                 hover:bg-blue-700 transition-colors duration-200
                                 font-semibold text-lg">
                  Enroll in Course
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 