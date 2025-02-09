'use client'
import { useEffect, useState, use } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { client } from '@/lib/sanity'
import { PortableTextBlock } from '@portabletext/types'

interface Lesson {
  _id: string
  title: string
  description?: string
  videoId: string
  duration?: number
  content?: PortableTextBlock[]
}

interface Module {
  _id: string
  title: string
  lessons: Lesson[]
}

interface Course {
  _id: string
  title: string
  modules: Module[]
}

interface UserProfile {
  isEnrolled: boolean
}

function getYouTubeEmbedUrl(url: string) {
  // Handle different YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)

  if (match && match[2].length === 11) {
    // Return secure embed URL
    return `https://www.youtube.com/embed/${match[2]}`
  }

  // If it's already an embed URL, ensure it's secure
  if (url.includes('/embed/')) {
    return url.replace('http://', 'https://')
  }

  return url
}

export default function CourseLearnPage({ 
  params 
}: { 
  params: Promise<{ courseId: string }>
}) {
  const resolvedParams = use(params)
  const courseId = resolvedParams.courseId
  const { user, loading } = useAuth()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
            "modules": modules[]-> {
              _id,
              title,
              "lessons": lessons[]-> {
                _id,
                title,
                description,
                videoId,
                duration,
                content
              }
            }
          }
        `, { courseId: resolvedParams.courseId })

        if (courseData) {
          setCourse(courseData)
          if (!currentLesson && courseData.modules[0]?.lessons[0]) {
            setCurrentLesson(courseData.modules[0].lessons[0])
          }
        }
      } catch (error) {
        console.error('Error loading course:', error)
      } finally {
        setLoadingCourse(false)
      }
    }

    loadCourse()
  }, [resolvedParams.courseId, user, loading, router, currentLesson])

  if (loading || loadingCourse) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold">Loading your course...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold text-red-400">{error}</h2>
        </div>
      </div>
    )
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-xl font-semibold text-red-400">Course not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-gray-800">
        <h1 className="text-lg font-semibold truncate">
          {currentLesson?.title}
        </h1>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-gray-700 rounded-lg"
        >
          {isSidebarOpen ? (
            <span className="text-xl">×</span> // Close icon
          ) : (
            <span className="text-xl">≡</span> // Menu icon
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] lg:h-screen">
        {/* Video Player Section */}
        <div className="w-full lg:flex-1 p-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              src={`https://www.youtube.com/embed/${currentLesson.videoId}`}
              className="w-full h-full"
              title={currentLesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-bold">{currentLesson.title}</h2>
            {currentLesson.duration && (
              <span className="text-sm text-gray-400 mt-1">
                Duration: {currentLesson.duration} minutes
              </span>
            )}
          </div>
        </div>

        {/* Course Content Sidebar - Mobile Overlay */}
        <div className={`
          fixed inset-0 lg:relative lg:w-80 bg-gray-800 
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          z-50 lg:z-auto
        `}>
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg"
          >
            <span className="text-xl">×</span>
          </button>

          <div className="h-full overflow-y-auto p-4">
            <h3 className="text-xl font-bold mb-4">{course.title}</h3>
            <div className="space-y-4">
              {course.modules.map((module) => (
                <div key={module._id}>
                  <h4 className="font-medium text-gray-300 mb-2">{module.title}</h4>
                  <div className="space-y-1">
                    {module.lessons.map((lesson) => (
                      <button
                        key={lesson._id}
                        onClick={() => {
                          setCurrentLesson(lesson)
                          setIsSidebarOpen(false) // Close sidebar on mobile after selection
                        }}
                        className={`w-full text-left p-2 rounded flex justify-between items-center ${
                          currentLesson._id === lesson._id
                            ? 'bg-indigo-600'
                            : 'hover:bg-gray-700'
                        }`}
                      >
                        <span className="text-sm">{lesson.title}</span>
                        {lesson.duration && (
                          <span className="text-xs text-gray-400">
                            {lesson.duration}m
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  )
} 