'use client'
import { useEffect, useState, use } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { client, serverClient } from '@/lib/sanity'
import { PortableTextBlock } from '@portabletext/types'
import Link from 'next/link'
import { CheckCircle, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Lesson {
  _id: string
  title: string
  description?: string
  videoId: string
  duration?: number
  content?: PortableTextBlock[]
  completed?: boolean
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

interface LessonProgress {
  _id?: string
  completed: boolean
  watchedPercentage: number
  notes?: any[]
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
  const [lessonProgress, setLessonProgress] = useState<LessonProgress | null>(null)
  const [notes, setNotes] = useState<string>('')
  const [courseProgress, setCourseProgress] = useState({ completed: 0, total: 0, percentage: 0 })
  const [savingNotes, setSavingNotes] = useState(false)

  // Get lesson progress data
  useEffect(() => {
    if (!user?.uid || !currentLesson?._id) return

    async function fetchLessonProgress() {
      try {
        // Get user's Sanity ID
        const userDoc = await client.fetch(`
          *[_type == "userProfile" && firebaseUID == $userId][0]._id
        `, { userId: user.uid })

        // Get progress for current lesson
        const progress = await client.fetch(`
          *[_type == "lessonProgress" && user._ref == $userDoc && lesson._ref == $lessonId][0] {
            _id,
            completed,
            watchedPercentage,
            notes
          }
        `, { 
          userDoc, 
          lessonId: currentLesson._id 
        })

        if (progress) {
          setLessonProgress(progress)
          setNotes(progress.notes ? progress.notes.map(block => block.children[0].text).join('\n') : '')
        } else {
          setLessonProgress({ completed: false, watchedPercentage: 0 })
          setNotes('')
        }
      } catch (err) {
        console.error('Error fetching lesson progress:', err)
      }
    }

    fetchLessonProgress()
  }, [user, currentLesson])

  // Calculate overall course progress
  useEffect(() => {
    if (!course) return

    async function calculateProgress() {
      try {
        // Get user's Sanity ID
        const userDoc = await client.fetch(`
          *[_type == "userProfile" && firebaseUID == $userId][0]._id
        `, { userId: user?.uid })

        // Get all completed lessons for this course
        const completedLessons = await client.fetch(`
          *[_type == "lessonProgress" && user._ref == $userDoc && course._ref == $courseId && completed == true].lesson._ref
        `, { 
          userDoc, 
          courseId: course._id 
        })

        // Calculate total lessons
        let totalLessons = 0
        course.modules.forEach(module => {
          totalLessons += module.lessons.length
        })

        // Set progress state
        setCourseProgress({
          completed: completedLessons.length,
          total: totalLessons,
          percentage: totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0
        })
      } catch (err) {
        console.error('Error calculating course progress:', err)
      }
    }

    calculateProgress()
  }, [course, user, lessonProgress])

  // Mark lesson as completed
  const markLessonCompleted = async () => {
    if (!user?.uid || !currentLesson?._id || !course?._id) return
    
    try {
      // Get user's Sanity ID
      const userDoc = await client.fetch(`
        *[_type == "userProfile" && firebaseUID == $userId][0]._id
      `, { userId: user.uid })

      // Check if there's an existing progress entry
      const existingProgress = await client.fetch(`
        *[_type == "lessonProgress" && user._ref == $userDoc && lesson._ref == $lessonId][0]._id
      `, { 
        userDoc, 
        lessonId: currentLesson._id 
      })

      // Use server actions or API routes here to update or create the progress record
      const response = await fetch('/api/update-lesson-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progressId: existingProgress,
          userId: userDoc,
          lessonId: currentLesson._id,
          courseId: course._id,
          completed: true,
          watchedPercentage: 100,
          lastWatched: new Date().toISOString()
        }),
      })

      if (response.ok) {
        // Update state
        setLessonProgress(prev => ({ 
          ...prev, 
          completed: true, 
          watchedPercentage: 100 
        }))
      }
    } catch (err) {
      console.error('Error marking lesson as completed:', err)
    }
  }

  // Save notes
  const saveNotes = async () => {
    if (!user?.uid || !currentLesson?._id || !course?._id) return
    
    setSavingNotes(true)
    
    try {
      // Get user's Sanity ID
      const userDoc = await client.fetch(`
        *[_type == "userProfile" && firebaseUID == $userId][0]._id
      `, { userId: user.uid })

      // Check if there's an existing progress entry
      const existingProgress = await client.fetch(`
        *[_type == "lessonProgress" && user._ref == $userDoc && lesson._ref == $lessonId][0]._id
      `, { 
        userDoc, 
        lessonId: currentLesson._id 
      })

      // Format notes for Portable Text
      const formattedNotes = [{
        _type: 'block',
        children: [{
          _type: 'span',
          text: notes
        }]
      }]

      // Use server actions or API routes here to update or create the notes
      const response = await fetch('/api/update-lesson-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progressId: existingProgress,
          userId: userDoc,
          lessonId: currentLesson._id,
          courseId: course._id,
          notes: formattedNotes,
          lastWatched: new Date().toISOString()
        }),
      })

      if (response.ok) {
        // Show success notification
        toast.success('Notes saved! They will be here when you return.', { 
          duration: 3000,
          position: 'bottom-center',
          style: {
            background: '#4B5563', // gray-600
            color: '#fff'
          }
        });
      } else {
        toast.error('Failed to save notes. Please try again.', {
          duration: 3000,
          position: 'bottom-center'
        });
      }
    } catch (err) {
      console.error('Error saving notes:', err)
      toast.error('Failed to save notes. Please try again.', {
        duration: 3000,
        position: 'bottom-center'
      });
    } finally {
      setSavingNotes(false)
    }
  }

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }

    async function loadCourse() {
      try {
        // First, get the user's Sanity document ID
        const userDoc = await client.fetch(`
          *[_type == "userProfile" && firebaseUID == $userId][0]._id
        `, { userId: user!.uid })

        // Then check if the user is enrolled in this course
        const enrollment = await client.fetch(`
          *[_type == "enrollment" && student._ref == $userDocId && course->slug.current == $courseId][0]
        `, { 
          userDocId: userDoc,
          courseId: resolvedParams.courseId 
        })

        if (!enrollment) {
          router.replace('/dashboard')
          return
        }

        // Get course data and lesson progress for user
        const courseData = await client.fetch(`
          *[_type == "course" && slug.current == $courseId][0] {
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

        // Get all completed lessons for this user and course
        if (courseData) {
          // Get completed lessons
          const completedLessons = await client.fetch(`
            *[_type == "lessonProgress" && user._ref == $userDocId && course._ref == $courseId && completed == true].lesson._ref
          `, { 
            userDocId: userDoc,
            courseId: courseData._id
          })

          // Mark completed lessons
          const updatedCourse = {
            ...courseData,
            modules: courseData.modules.map(module => ({
              ...module,
              lessons: module.lessons.map(lesson => ({
                ...lesson,
                completed: completedLessons.includes(lesson._id)
              }))
            }))
          }

          setCourse(updatedCourse)
          
          if (!currentLesson && updatedCourse.modules?.[0]?.lessons?.[0]) {
            setCurrentLesson(updatedCourse.modules[0].lessons[0])
          }
        }
      } catch (error) {
        console.error('Error loading course:', error)
        setError('Error loading course')
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
          <h2 className="text-xl font-semibold text-red-400">
            {course ? "No lessons available yet" : "Course not found"}
          </h2>
          <p className="mt-2 text-gray-400">
            {course ? "Please check back later when content has been added." : ""}
          </p>
          <Link 
            href="/courses" 
            className="mt-4 inline-block text-indigo-400 hover:text-indigo-300"
          >
            ← Back to Courses
          </Link>
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
        {/* Video and Notes Section */}
        <div className="w-full lg:flex-1 p-4 overflow-y-auto">
          {/* Course Progress Bar */}
          <div className="mb-4 bg-gray-800 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  <span>←</span> <span>Back to Dashboard</span>
                </Link>
              </div>
              <span className="text-sm">{courseProgress.completed}/{courseProgress.total} lessons completed ({courseProgress.percentage}%)</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full" 
                style={{ width: `${courseProgress.percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Video Player */}
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {currentLesson?.videoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${currentLesson.videoId}`}
                className="w-full h-full"
                title={currentLesson.title || 'Video lesson'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400">No video available</span>
              </div>
            )}
          </div>
          
          {/* Lesson Header */}
          <div className="mt-4 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{currentLesson.title}</h2>
              {currentLesson.duration && (
                <span className="text-sm text-gray-400 mt-1">
                  Duration: {currentLesson.duration} minutes
                </span>
              )}
            </div>
            <button
              onClick={markLessonCompleted}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                lessonProgress?.completed
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <CheckCircle2 size={16} />
              {lessonProgress?.completed ? 'Completed' : 'Mark Complete'}
            </button>
          </div>

          {/* Notes Section */}
          <div className="mt-6 bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Notes</h3>
              <span className="text-xs text-gray-400">Notes are saved automatically with your course progress</span>
            </div>
            <textarea
              className="w-full h-32 bg-gray-700 text-white rounded-lg p-3 resize-none mb-2"
              placeholder="Take notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {savingNotes ? 'Saving...' : 'Save Notes'}
            </button>
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
                        <div className="flex items-center">
                          {lesson.completed && (
                            <CheckCircle className="text-green-500 mr-2" size={14} />
                          )}
                          <span className="text-sm">{lesson.title}</span>
                        </div>
                        {lesson.duration && (
                          <span className="text-xs text-gray-400 ml-2">
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