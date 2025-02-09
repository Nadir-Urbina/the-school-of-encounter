'use client'
import { useEffect, useState } from 'react'
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
  totalStudents: number
  newStudents: number // Last 30 days
}

export default function TeacherDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }

    async function loadInstructorCourses() {
      try {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        console.log('Firebase UID:', user!.uid)

        // First get the instructor document using firebaseUID
        const instructorDoc = await client.fetch(`
          *[_type == "instructor" && firebaseUID == $uid][0] {
            _id
          }
        `, { uid: user!.uid })

        console.log('Instructor doc:', instructorDoc)

        if (!instructorDoc) {
          console.error('No instructor document found')
          return
        }

        const coursesData = await client.fetch(`
          *[_type == "course" && $instructorId in instructors[]._ref] {
            _id,
            title,
            courseImage,
            description,
            "totalStudents": count(*[_type == "userProfile" && references(^._id)]),
            "newStudents": count(*[
              _type == "userProfile" && 
              references(^._id) && 
              dateTime(_updatedAt) > dateTime($thirtyDaysAgo)
            ])
          }
        `, {
          instructorId: instructorDoc._id,
          thirtyDaysAgo: thirtyDaysAgo.toISOString()
        })

        console.log('Courses found:', coursesData)
        setCourses(coursesData)
      } catch (error) {
        console.error('Error loading instructor courses:', error)
      } finally {
        setLoadingCourses(false)
      }
    }

    loadInstructorCourses()
  }, [user, loading, router])

  if (loading || loadingCourses) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading your dashboard...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your courses and track student progress</p>
        </div>

        {/* Course Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {course.courseImage && (
                <div className="relative h-48">
                  <Image
                    src={urlFor(course.courseImage).url()}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {course.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Total Students</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {course.totalStudents}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">New Students (30d)</p>
                    <p className="text-2xl font-semibold text-indigo-600">
                      +{course.newStudents}
                    </p>
                  </div>
                </div>

                {/* Course Actions */}
                <div className="mt-6">
                  <Link
                    href={`/courses/${course._id}/manage`}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                  >
                    Manage Course →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
            <p className="mt-2 text-gray-600">
              You haven't created any courses yet.
            </p>
            <a
              href="/courses/create"
              className="mt-4 inline-block text-indigo-600 hover:text-indigo-700"
            >
              Create Your First Course →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

