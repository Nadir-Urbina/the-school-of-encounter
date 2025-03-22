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
  price: number
  studentCount: number
  modules: Array<{
    _id: string
    title: string
    lessons: Array<{
      _id: string
      title: string
      videoId: string
    }>
  }>
  completionRate: number
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
        // First fetch the basic course data
        let courseData;
        try {
          courseData = await client.fetch(`
            *[_type == "course" && _id == $courseId][0] {
              _id,
              title,
              courseImage,
              description,
              price,
              "studentCount": count(*[_type == "enrollment" && course._ref == ^._id]),
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
          `, { courseId: resolvedParams.courseId });
        } catch (queryError) {
          console.error('Error fetching course data:', queryError);
          setLoadingCourse(false);
          return;
        }

        if (!courseData) {
          console.log('No course found with ID:', resolvedParams.courseId);
          setLoadingCourse(false);
          return;
        }

        // Ensure modules is always an array
        const modules = courseData.modules || [];

        // Extract the student count that we directly fetched
        const studentCount = courseData.studentCount || 0;

        // Count the total number of lessons across all modules
        const totalLessons = modules.reduce((total, module) => {
          // Make sure module.lessons is also an array
          const lessons = module.lessons || [];
          return total + lessons.length;
        }, 0);

        // Calculate lesson completion statistics in a separate query
        let completedLessonsData;
        try {
          // Using the same query structure as in other parts of the application
          const completionResult = await client.fetch(`
            *[_type == "lessonProgress" && course._ref == $courseId && completed == true] {
              user._ref,
              lesson._ref
            }
          `, { courseId: resolvedParams.courseId });
          
          completedLessonsData = completionResult || [];
        } catch (statsError) {
          console.error('Error fetching lesson completion data:', statsError);
          // Continue with default values rather than failing completely
          completedLessonsData = [];
        }

        // Calculate completion rate
        let completionRate = 0;
        if (studentCount > 0 && totalLessons > 0) {
          // Create a map of student to completed lessons
          const studentProgress = {};
          completedLessonsData.forEach(progress => {
            if (!studentProgress[progress.user._ref]) {
              studentProgress[progress.user._ref] = new Set();
            }
            studentProgress[progress.user._ref].add(progress.lesson._ref);
          });

          // Calculate the average completion percentage across all students
          let totalCompletionPercentage = 0;
          Object.keys(studentProgress).forEach(studentId => {
            const studentCompletionPercentage = (studentProgress[studentId].size / totalLessons) * 100;
            totalCompletionPercentage += studentCompletionPercentage;
          });

          // Average completion rate (rounded to nearest integer)
          completionRate = Math.round(totalCompletionPercentage / studentCount);
        }

        // Merge the stats with the course data
        const enrichedCourse = {
          ...courseData,
          studentCount,
          completionRate,
          modules
        }

        setCourse(enrichedCourse)
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
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-indigo-600">{course.studentCount}</p>
                {course.studentCount > 0 && (
                  <span className="ml-2 text-xs text-green-600 font-medium">Active Enrollments</span>
                )}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Completion Rate</p>
              <div className="flex flex-col">
                <p className="text-2xl font-semibold text-indigo-600">{course.completionRate}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full" 
                    style={{ width: `${course.completionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Modules</p>
              <p className="text-2xl font-semibold text-indigo-600">{(course.modules || []).length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Lessons</p>
              <p className="text-2xl font-semibold text-indigo-600">
                {(course.modules || []).reduce((total, module) => total + (module.lessons || []).length, 0)}
              </p>
            </div>
          </div>

          {/* Stats Explanation */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0 sm:pt-0">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
              <h3 className="font-semibold mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Understanding Your Course Statistics
              </h3>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><span className="font-medium">Total Students:</span> Number of students currently enrolled in your course</li>
                <li><span className="font-medium">Completion Rate:</span> Average percentage of lessons completed by enrolled students</li>
                <li><span className="font-medium">Modules & Lessons:</span> Total count of content items in your course</li>
              </ul>
            </div>
          </div>

          {/* Course Content */}
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold mb-6">Course Content</h2>
            <div className="space-y-6">
              {(course.modules || []).map((module) => (
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
                      {(module.lessons || []).map((lesson) => (
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