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
        if (!user) return;
        
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
          lessonId: currentLesson?._id 
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
          courseId: course?._id 
        })

        // Calculate total lessons
        let totalLessons = 0
        course?.modules.forEach(module => {
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
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
            {currentLesson?.videoId ? (
              <>
                <iframe
                  src={`https://www.youtube.com/embed/${currentLesson.videoId}?enablejsapi=1&rel=0&modestbranding=1`}
                  className="w-full h-full"
                  title={currentLesson.title || 'Video lesson'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                
                {/* Video Overlay Controls */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => {
                      // Copy video link
                      navigator.clipboard.writeText(window.location.href)
                      toast.success('Video link copied!', { duration: 2000 })
                    }}
                    className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-lg transition-all"
                    title="Copy link"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                
                {/* Video Info Overlay */}
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="text-sm font-medium">{currentLesson.title}</div>
                  {currentLesson.duration && (
                    <div className="text-xs text-gray-300">Duration: {currentLesson.duration} min</div>
                  )}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-gray-400">No video available for this lesson</span>
                </div>
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
            <div className="flex items-center gap-2">
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
          </div>

          {/* Navigation Controls */}
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => {
                const allLessons = course.modules.flatMap(m => m.lessons)
                const currentIndex = allLessons.findIndex(l => l._id === currentLesson._id)
                if (currentIndex > 0) {
                  setCurrentLesson(allLessons[currentIndex - 1])
                }
              }}
              disabled={course.modules.flatMap(m => m.lessons).findIndex(l => l._id === currentLesson._id) === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>←</span> Previous Lesson
            </button>
            
            <div className="text-center">
              <span className="text-sm text-gray-400">
                Lesson {course.modules.flatMap(m => m.lessons).findIndex(l => l._id === currentLesson._id) + 1} of {course.modules.flatMap(m => m.lessons).length}
              </span>
            </div>
            
            <button
              onClick={() => {
                const allLessons = course.modules.flatMap(m => m.lessons)
                const currentIndex = allLessons.findIndex(l => l._id === currentLesson._id)
                if (currentIndex < allLessons.length - 1) {
                  setCurrentLesson(allLessons[currentIndex + 1])
                }
              }}
              disabled={course.modules.flatMap(m => m.lessons).findIndex(l => l._id === currentLesson._id) === course.modules.flatMap(m => m.lessons).length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Lesson <span>→</span>
            </button>
          </div>

          {/* Notes Section */}
          <div className="mt-6 bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Notes</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Auto-saved with progress</span>
                {notes.length > 0 && (
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                    {notes.length} characters
                  </span>
                )}
              </div>
            </div>
            
            {/* Notes Input with Enhanced UI */}
            <div className="bg-gray-700 rounded-lg p-1">
              <textarea
                className="w-full h-32 bg-transparent text-white p-3 resize-none focus:outline-none"
                placeholder={`Take notes for "${currentLesson.title}"...\n\nTip: Save important timestamps or key concepts here.`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
              
              <div className="flex justify-between items-center px-3 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                      setNotes(prev => prev + (prev ? '\n\n' : '') + `[${timestamp}] `)
                    }}
                    className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-gray-300"
                  >
                    + Timestamp
                  </button>
                  <button
                    onClick={() => setNotes('')}
                    className="text-xs text-gray-400 hover:text-gray-300"
                    disabled={!notes}
                  >
                    Clear
                  </button>
                </div>
                
                <button
                  onClick={saveNotes}
                  disabled={savingNotes}
                  className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg disabled:opacity-50 text-sm font-medium"
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
            
            {/* Quick Note Templates */}
            <div className="mt-3 flex flex-wrap gap-2">
              {['Key Point', 'Question', 'Action Item', 'Important'].map((template) => (
                <button
                  key={template}
                  onClick={() => {
                    const addition = notes ? '\n\n' : ''
                    setNotes(prev => prev + addition + `${template}: `)
                  }}
                  className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-300"
                >
                  + {template}
                </button>
              ))}
            </div>
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
              {course.modules.map((module, moduleIndex) => {
                const moduleProgress = {
                  completed: module.lessons.filter(l => l.completed).length,
                  total: module.lessons.length
                }
                const modulePercentage = moduleProgress.total > 0 ? (moduleProgress.completed / moduleProgress.total) * 100 : 0
                
                return (
                  <div key={module._id} className="bg-gray-750 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-white">{module.title}</h4>
                      <span className="text-xs text-gray-400">
                        {moduleProgress.completed}/{moduleProgress.total}
                      </span>
                    </div>
                    
                    {/* Module Progress Bar */}
                    <div className="w-full bg-gray-600 rounded-full h-1.5 mb-3">
                      <div 
                        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${modulePercentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="space-y-1">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <button
                          key={lesson._id}
                          onClick={() => {
                            setCurrentLesson(lesson)
                            setIsSidebarOpen(false) // Close sidebar on mobile after selection
                          }}
                          className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-all duration-200 ${
                            currentLesson._id === lesson._id
                              ? 'bg-indigo-600 shadow-lg'
                              : lesson.completed
                              ? 'bg-gray-700 hover:bg-gray-650'
                              : 'hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="flex items-center justify-center w-6 h-6 mr-3">
                              {lesson.completed ? (
                                <CheckCircle className="text-green-500" size={16} />
                              ) : (
                                <div className={`w-2 h-2 rounded-full ${
                                  currentLesson._id === lesson._id ? 'bg-white' : 'bg-gray-500'
                                }`} />
                              )}
                            </div>
                            <div>
                              <span className={`text-sm ${
                                currentLesson._id === lesson._id ? 'text-white font-medium' : 'text-gray-200'
                              }`}>
                                {lesson.title}
                              </span>
                              <div className="text-xs text-gray-400 mt-1">
                                Lesson {moduleIndex + 1}.{lessonIndex + 1}
                              </div>
                            </div>
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
                )
              })}
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