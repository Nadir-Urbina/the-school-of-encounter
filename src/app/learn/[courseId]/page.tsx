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

// Add new enhanced interfaces
interface VideoProgress {
  lessonId: string;
  currentTime: number;
  duration: number;
  watchPercentage: number;
  lastWatched: Date;
}

interface VideoPlayerSettings {
  playbackSpeed: number;
  autoAdvance: boolean;
  theaterMode: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt?: Date;
}

interface ProgressMilestone {
  percentage: number;
  title: string;
  reached: boolean;
  unlockedAt?: Date;
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

  // Enhanced Video Player State
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [theaterMode, setTheaterMode] = useState(false)
  const [videoProgress, setVideoProgress] = useState<VideoProgress | null>(null)
  const [showSpeedSelector, setShowSpeedSelector] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [resumeTime, setResumeTime] = useState<number | null>(null)

  // Enhanced Progress State
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [milestones, setMilestones] = useState<ProgressMilestone[]>([
    { percentage: 25, title: "Getting Started", reached: false },
    { percentage: 50, title: "Halfway Hero", reached: false },
    { percentage: 75, title: "Almost There", reached: false },
    { percentage: 100, title: "Course Champion", reached: false }
  ])
  const [studyStreak, setStudyStreak] = useState(0)
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null)

  // Enhanced Notes State
  const [notesSearchTerm, setNotesSearchTerm] = useState('')
  const [selectedNoteType, setSelectedNoteType] = useState('all')
  const [noteTags, setNoteTags] = useState<string[]>([])
  const [showRichTextToolbar, setShowRichTextToolbar] = useState(false)

  // Tabbed Interface State
  const [activeTab, setActiveTab] = useState('overview')

  // Tab definitions
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'qa', label: 'Q&A', icon: '💬' },
    { id: 'resources', label: 'Resources', icon: '📁' }
  ]

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

        // Calculate new percentage
        const newPercentage = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0

        // Set progress state
        setCourseProgress({
          completed: completedLessons.length,
          total: totalLessons,
          percentage: newPercentage
        })

        // Check for milestone achievements
        checkMilestones(newPercentage)
        
        // Calculate estimated time remaining
        calculateEstimatedTime()
        
        // Update study streak when lesson is completed
        if (completedLessons.length > courseProgress.completed) {
          updateStudyStreak()
        }
      } catch (err) {
        console.error('Error calculating course progress:', err)
      }
    }

    calculateProgress()
  }, [course, user, lessonProgress])

  // Initialize enhanced features
  useEffect(() => {
    // Load saved playback speed
    const savedSpeed = localStorage.getItem('playback_speed')
    if (savedSpeed) {
      setPlaybackSpeed(parseFloat(savedSpeed))
    }

    // Load study streak
    const savedStreak = localStorage.getItem('study_streak')
    if (savedStreak) {
      setStudyStreak(parseInt(savedStreak))
    }

    // Load theater mode preference
    const savedTheaterMode = localStorage.getItem('theater_mode')
    if (savedTheaterMode === 'true') {
      setTheaterMode(true)
    }
  }, [])

  // Load video progress when lesson changes
  useEffect(() => {
    if (currentLesson?._id) {
      loadVideoProgress()
    }
  }, [currentLesson])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return // Don't trigger in notes

      switch (e.key) {
        case ' ':
          e.preventDefault()
          // Would pause/play video
          break
        case 'f':
          e.preventDefault()
          setTheaterMode(!theaterMode)
          break
        case 'k':
          e.preventDefault()
          setShowKeyboardShortcuts(!showKeyboardShortcuts)
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
          e.preventDefault()
          const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
          const speedIndex = parseInt(e.key) - 1
          if (speeds[speedIndex]) {
            updatePlaybackSpeed(speeds[speedIndex])
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [theaterMode, showKeyboardShortcuts])

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

  // Enhanced Video Functions
  const saveVideoProgress = async (currentTime: number, duration: number) => {
    if (!currentLesson?._id || !user?.uid) return

    const watchPercentage = Math.round((currentTime / duration) * 100)
    const progressData: VideoProgress = {
      lessonId: currentLesson._id,
      currentTime,
      duration,
      watchPercentage,
      lastWatched: new Date()
    }

    // Save to localStorage for immediate use
    localStorage.setItem(`video_progress_${currentLesson._id}`, JSON.stringify(progressData))
    setVideoProgress(progressData)

    // Auto-complete lesson if 90% watched
    if (watchPercentage >= 90 && !lessonProgress?.completed) {
      markLessonCompleted()
    }
  }

  const loadVideoProgress = () => {
    if (!currentLesson?._id) return

    const saved = localStorage.getItem(`video_progress_${currentLesson._id}`)
    if (saved) {
      const progress: VideoProgress = JSON.parse(saved)
      setVideoProgress(progress)
      // Set resume time if more than 10% watched but less than 90%
      if (progress.watchPercentage > 10 && progress.watchPercentage < 90) {
        setResumeTime(progress.currentTime)
      }
    }
  }

  const updatePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed)
    // This would integrate with YouTube iframe API
    localStorage.setItem('playback_speed', speed.toString())
  }

  // Enhanced Progress Functions
  const checkMilestones = (newPercentage: number) => {
    const updatedMilestones = milestones.map(milestone => {
      if (newPercentage >= milestone.percentage && !milestone.reached) {
        // Show celebration
        toast.success(`🎉 Achievement Unlocked: ${milestone.title}!`, {
          duration: 4000,
          position: 'top-center',
          style: {
            background: '#4F46E5',
            color: '#fff',
            fontSize: '16px'
          }
        })
        return { ...milestone, reached: true, unlockedAt: new Date() }
      }
      return milestone
    })
    setMilestones(updatedMilestones)
  }

  const calculateEstimatedTime = () => {
    if (!course) return

    const allLessons = course.modules.flatMap(m => m.lessons)
    const remainingLessons = allLessons.filter(l => !l.completed)
    const averageDuration = 15 // minutes, could be calculated from actual lesson durations
    
    const totalMinutes = remainingLessons.length * averageDuration
    setEstimatedTimeRemaining(totalMinutes)
  }

  const updateStudyStreak = () => {
    const today = new Date().toDateString()
    const lastStudyDate = localStorage.getItem('last_study_date')
    
    if (lastStudyDate === today) {
      return // Already studied today
    }
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (lastStudyDate === yesterday.toDateString()) {
      // Continuing streak
      const currentStreak = parseInt(localStorage.getItem('study_streak') || '0')
      const newStreak = currentStreak + 1
      setStudyStreak(newStreak)
      localStorage.setItem('study_streak', newStreak.toString())
    } else {
      // Starting new streak
      setStudyStreak(1)
      localStorage.setItem('study_streak', '1')
    }
    
    localStorage.setItem('last_study_date', today)
  }

  // Enhanced Notes Functions
  const insertTimestamp = () => {
    const now = new Date()
    const timestamp = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    const videoTime = videoProgress ? `${Math.floor(videoProgress.currentTime / 60)}:${Math.floor(videoProgress.currentTime % 60).toString().padStart(2, '0')}` : ''
    
    const timestampText = videoTime ? `[${timestamp} | Video: ${videoTime}] ` : `[${timestamp}] `
    setNotes(prev => prev + (prev ? '\n\n' : '') + timestampText)
  }

  const addNoteTemplate = (template: string) => {
    const addition = notes ? '\n\n' : ''
    const templateText = template === 'Question' ? '❓ Question: ' : 
                        template === 'Key Point' ? '🔑 Key Point: ' :
                        template === 'Action Item' ? '✅ Action Item: ' :
                        template === 'Important' ? '⚠️ Important: ' : `${template}: `
    
    setNotes(prev => prev + addition + templateText)
  }

  const searchNotes = (term: string) => {
    setNotesSearchTerm(term)
    // This would filter notes in a more complex implementation
  }

  const formatNotesText = (text: string) => {
    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
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

        // Then check if the user is enrolled in this course or is an admin
        const enrollment = await client.fetch(`
          *[_type == "enrollment" && student._ref == $userDocId && course->slug.current == $courseId][0]
        `, { 
          userDocId: userDoc,
          courseId: resolvedParams.courseId 
        })

        // Allow access if user is enrolled OR if user is an admin
        if (!enrollment && user.role !== 'admin') {
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

      {/* Main Layout Container - Restructured for Udemy-style layout */}
      <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen">
        {/* Video and Content Section - Optimized width distribution */}
        <div className="flex-1 lg:flex-[0_0_70%] p-4 lg:p-6 overflow-y-auto">
          {/* Enhanced Course Progress Bar */}
          <div className="mb-4 bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  <span>←</span> <span>Back to Dashboard</span>
                </Link>
                {studyStreak > 0 && (
                  <div className="flex items-center gap-1 text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full text-xs">
                    🔥 {studyStreak} day{studyStreak > 1 ? 's' : ''} streak!
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                {/* Circular Progress Indicator */}
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="stroke-gray-600"
                      strokeDasharray="100, 100"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="stroke-indigo-500 transition-all duration-500 ease-out"
                      strokeDasharray={`${courseProgress.percentage}, 100`}
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">{courseProgress.percentage}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{courseProgress.completed}/{courseProgress.total} lessons completed</div>
                  {estimatedTimeRemaining && (
                    <div className="text-xs text-gray-400">~{Math.floor(estimatedTimeRemaining / 60)}h {estimatedTimeRemaining % 60}m remaining</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Linear Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-3 relative overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-700 ease-out relative" 
                style={{ width: `${courseProgress.percentage}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
              </div>
            </div>

            {/* Milestone Indicators */}
            <div className="flex justify-between items-center relative">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex flex-col items-center relative group">
                  <div 
                    className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                      milestone.reached 
                        ? 'bg-indigo-500 border-indigo-400 scale-125' 
                        : courseProgress.percentage >= milestone.percentage
                        ? 'bg-indigo-400 border-indigo-300'
                        : 'bg-gray-600 border-gray-500'
                    }`}
                  >
                    {milestone.reached && (
                      <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-75"></div>
                    )}
                  </div>
                  <div className="absolute top-5 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                    {milestone.title} ({milestone.percentage}%)
                  </div>
                </div>
              ))}
              {/* Connecting line */}
              <div className="absolute top-1.5 left-0 right-0 h-0.5 bg-gray-600 -z-10"></div>
            </div>
          </div>

          {/* Enhanced Video Player - Optimized for efficient layout */}
          <div className="flex justify-center">
            <div className={`relative bg-black rounded-lg overflow-hidden group transition-all duration-300 w-full max-w-4xl ${
              theaterMode ? 'aspect-[21/9]' : 'aspect-video lg:max-h-[500px]'
            }`}>
            {currentLesson?.videoId ? (
              <>
                <iframe
                  src={`https://www.youtube.com/embed/${currentLesson.videoId}?enablejsapi=1&rel=0&modestbranding=1&showinfo=0&controls=1&disablekb=1&fs=0&iv_load_policy=3${resumeTime ? `&start=${Math.floor(resumeTime)}` : ''}`}
                  className="w-full h-full"
                  title={currentLesson.title || 'Video lesson'}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                
                {/* Enhanced Video Overlay Controls */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {/* Playback Speed Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSpeedSelector(!showSpeedSelector)}
                      className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-lg transition-all flex items-center gap-1"
                      title="Playback speed"
                    >
                      <span className="text-xs">{playbackSpeed}x</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showSpeedSelector && (
                      <div className="absolute top-full right-0 mt-1 bg-gray-800 rounded-lg py-2 shadow-lg z-20 min-w-[80px]">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <button
                            key={speed}
                            onClick={() => {
                              updatePlaybackSpeed(speed)
                              setShowSpeedSelector(false)
                            }}
                            className={`block w-full text-left px-3 py-1 text-sm hover:bg-gray-700 ${
                              playbackSpeed === speed ? 'text-indigo-400' : 'text-white'
                            }`}
                          >
                            {speed}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Theater Mode Toggle */}
                  <button
                    onClick={() => {
                      setTheaterMode(!theaterMode)
                      localStorage.setItem('theater_mode', (!theaterMode).toString())
                    }}
                    className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-lg transition-all"
                    title={theaterMode ? "Exit theater mode (F)" : "Theater mode (F)"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={theaterMode ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
                  </button>

                  {/* Keyboard Shortcuts */}
                  <button
                    onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                    className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-lg transition-all"
                    title="Keyboard shortcuts (K)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  </button>

                  {/* Copy Link */}
                  <button
                    onClick={() => {
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

                {/* Keyboard Shortcuts Tooltip */}
                {showKeyboardShortcuts && (
                  <div className="absolute top-16 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-20 text-sm max-w-xs">
                    <h4 className="font-semibold mb-2">Keyboard Shortcuts</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span>Space</span><span>Pause/Play</span></div>
                      <div className="flex justify-between"><span>F</span><span>Theater Mode</span></div>
                      <div className="flex justify-between"><span>K</span><span>Show Shortcuts</span></div>
                      <div className="flex justify-between"><span>1-6</span><span>Speed (0.5x-2x)</span></div>
                    </div>
                    <button
                      onClick={() => setShowKeyboardShortcuts(false)}
                      className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Close
                    </button>
                  </div>
                )}
                
                {/* Enhanced Video Info Overlay */}
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="text-sm font-medium">{currentLesson.title}</div>
                  <div className="flex items-center gap-4 text-xs text-gray-300 mt-1">
                    {currentLesson.duration && (
                      <span>Duration: {currentLesson.duration} min</span>
                    )}
                    <span>
                      Lesson {course.modules.flatMap(m => m.lessons).findIndex(l => l._id === currentLesson._id) + 1} of {course.modules.flatMap(m => m.lessons).length}
                    </span>
                  </div>
                </div>

                {/* Resume Video Notification */}
                {resumeTime && resumeTime > 10 && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-30">
                    <div className="text-center">
                      <h4 className="font-semibold mb-2">Resume Video?</h4>
                      <p className="text-sm text-gray-300 mb-3">
                        Resume from {Math.floor(resumeTime / 60)}:{Math.floor(resumeTime % 60).toString().padStart(2, '0')}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setResumeTime(null)}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                        >
                          Start Over
                        </button>
                        <button
                          onClick={() => setResumeTime(null)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-sm"
                        >
                          Resume
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Video Progress Bar */}
                {videoProgress && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                    <div 
                      className="h-1 bg-indigo-500 transition-all duration-300"
                      style={{ width: `${videoProgress.watchPercentage}%` }}
                    />
                    {videoProgress.watchPercentage >= 90 && (
                      <div className="absolute -top-8 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                        ✓ Watched
                      </div>
                    )}
                  </div>
                )}
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
          </div>
          
          {/* Lesson Header - Compact */}
          <div className="mt-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">{currentLesson.title}</h2>
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

          {/* Udemy-Style Tabbed Interface */}
          <div className="mt-6 lg:mt-8">
            {/* Tab Navigation */}
            <div className="border-b border-gray-700">
              <nav className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                    {tab.id === 'notes' && notes.length > 0 && (
                      <span className="bg-gray-700 text-xs px-2 py-0.5 rounded-full">
                        {notes.split('\n').filter(line => line.trim()).length}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Lesson Description */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">About This Lesson</h3>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300 leading-relaxed">
                        {currentLesson.description || "This lesson covers important concepts that will help you progress in your learning journey."}
                      </p>
                    </div>
                  </div>

                  {/* Learning Objectives */}
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">What You'll Learn</h3>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        <span>Key concepts and principles covered in this lesson</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        <span>Practical applications and real-world examples</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        <span>Essential knowledge for your spiritual growth</span>
                      </li>
                    </ul>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex justify-between items-center p-6 bg-gray-800 rounded-lg">
                    <button
                      onClick={() => {
                        const allLessons = course.modules.flatMap(m => m.lessons)
                        const currentIndex = allLessons.findIndex(l => l._id === currentLesson._id)
                        if (currentIndex > 0) {
                          setCurrentLesson(allLessons[currentIndex - 1])
                        }
                      }}
                      disabled={course.modules.flatMap(m => m.lessons).findIndex(l => l._id === currentLesson._id) === 0}
                      className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next Lesson <span>→</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Your Notes</h3>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      {studyStreak > 1 && (
                        <div className="text-xs text-orange-400">
                          📝 {Math.floor(Math.random() * 5) + 3} notes today
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>Auto-saved with progress</span>
                        {notes.length > 0 && (
                          <span className="bg-gray-700 px-2 py-1 rounded">
                            {notes.length} characters
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes Search and Filter */}
                  {notes.length > 50 && (
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Search notes..."
                          value={notesSearchTerm}
                          onChange={(e) => searchNotes(e.target.value)}
                          className="w-full bg-gray-700 text-white px-3 py-2 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <svg className="absolute right-2 top-2.5 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <select
                        value={selectedNoteType}
                        onChange={(e) => setSelectedNoteType(e.target.value)}
                        className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="all">All Notes</option>
                        <option value="questions">Questions</option>
                        <option value="key-points">Key Points</option>
                        <option value="action-items">Action Items</option>
                      </select>
                    </div>
                  )}
                  
                  {/* Rich Text Toolbar */}
                  <div className="bg-gray-700 rounded-lg p-1 mb-1">
                    <div className="flex items-center justify-between p-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setShowRichTextToolbar(!showRichTextToolbar)}
                          className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-gray-300 flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                          </svg>
                          Format
                        </button>
                        
                        {showRichTextToolbar && (
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => {
                                const textarea = document.querySelector('textarea') as HTMLTextAreaElement
                                if (textarea) {
                                  const start = textarea.selectionStart
                                  const end = textarea.selectionEnd
                                  const selectedText = notes.substring(start, end)
                                  const newText = notes.substring(0, start) + `**${selectedText}**` + notes.substring(end)
                                  setNotes(newText)
                                }
                              }}
                              className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-gray-300"
                              title="Bold (**text**)"
                            >
                              B
                            </button>
                            <button
                              onClick={() => {
                                const textarea = document.querySelector('textarea') as HTMLTextAreaElement
                                if (textarea) {
                                  const start = textarea.selectionStart
                                  const end = textarea.selectionEnd
                                  const selectedText = notes.substring(start, end)
                                  const newText = notes.substring(0, start) + `*${selectedText}*` + notes.substring(end)
                                  setNotes(newText)
                                }
                              }}
                              className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-gray-300 italic"
                              title="Italic (*text*)"
                            >
                              I
                            </button>
                            <button
                              onClick={() => {
                                setNotes(prev => prev + (prev ? '\n' : '') + '- ')
                              }}
                              className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-gray-300"
                              title="Bullet point"
                            >
                              •
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={insertTimestamp}
                          className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-gray-300 flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Timestamp
                        </button>
                        <button
                          onClick={() => setNotes('')}
                          className="text-xs text-gray-400 hover:text-gray-300"
                          disabled={!notes}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Enhanced Notes Input */}
                    <textarea
                      className="w-full h-32 bg-transparent text-white p-3 resize-none focus:outline-none placeholder-gray-400"
                      placeholder={`Take notes for "${currentLesson.title}"...\n\nTips:\n• Use **bold** or *italic* for emphasis\n• Add timestamps with video time\n• Try the smart templates below`}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab') {
                          e.preventDefault()
                          const target = e.target as HTMLTextAreaElement
                          const start = target.selectionStart
                          const end = target.selectionEnd
                          setNotes(prev => prev.substring(0, start) + '  ' + prev.substring(end))
                        }
                      }}
                    />
                    
                    <div className="flex justify-between items-center px-3 pb-2">
                      <button
                        onClick={saveNotes}
                        disabled={savingNotes}
                        className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg disabled:opacity-50 text-sm font-medium transition-all"
                      >
                        {savingNotes ? (
                          <span className="flex items-center gap-2">
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </span>
                        ) : (
                          'Save Notes'
                        )}
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          Last saved: {savingNotes ? 'Saving...' : 'Just now'}
                        </span>
                        {notes.length > 500 && (
                          <button
                            onClick={() => {
                              const blob = new Blob([notes], { type: 'text/plain' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `${currentLesson.title}-notes.txt`
                              a.click()
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Quick Note Templates */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Smart Templates</span>
                      <span className="text-xs text-gray-500">Click to add structured notes</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Key Point', icon: '🔑', description: 'Important concept or idea' },
                        { name: 'Question', icon: '❓', description: 'Something to explore further' },
                        { name: 'Action Item', icon: '✅', description: 'Task or next step' },
                        { name: 'Important', icon: '⚠️', description: 'Critical information' },
                        { name: 'Quote', icon: '💬', description: 'Notable quote or statement' },
                        { name: 'Reflection', icon: '🤔', description: 'Personal thoughts' }
                      ].map((template) => (
                        <button
                          key={template.name}
                          onClick={() => addNoteTemplate(template.name)}
                          className="group relative text-xs bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-gray-300 transition-all flex items-center gap-1"
                          title={template.description}
                        >
                          <span>{template.icon}</span>
                          <span>{template.name}</span>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                            {template.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes Preview/Summary */}
                  {notes.length > 100 && (
                    <div className="mt-4 p-3 bg-gray-750 rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Notes Summary</span>
                        <span className="text-xs text-gray-400">
                          {notes.split('\n').filter(line => line.trim()).length} entries
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 space-y-1">
                        {notes.includes('🔑') && <div>• {(notes.match(/🔑/g) || []).length} key points identified</div>}
                        {notes.includes('❓') && <div>• {(notes.match(/❓/g) || []).length} questions noted</div>}
                        {notes.includes('✅') && <div>• {(notes.match(/✅/g) || []).length} action items listed</div>}
                        {notes.includes('[') && <div>• {(notes.match(/\[[^\]]+\]/g) || []).length} timestamps recorded</div>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Tab */}
              {activeTab === 'progress' && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Your Progress</h3>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      {studyStreak > 0 && (
                        <div className="flex items-center gap-1 text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full text-xs">
                          🔥 {studyStreak} day{studyStreak > 1 ? 's' : ''} streak!
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Circular Progress Indicator */}
                      <div className="relative w-12 h-12">
                        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="stroke-gray-600"
                            strokeDasharray="100, 100"
                            strokeWidth="3"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="stroke-indigo-500 transition-all duration-500 ease-out"
                            strokeDasharray={`${courseProgress.percentage}, 100`}
                            strokeWidth="3"
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-semibold text-white">{courseProgress.percentage}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{courseProgress.completed}/{courseProgress.total} lessons completed</div>
                        {estimatedTimeRemaining && (
                          <div className="text-xs text-gray-400">~{Math.floor(estimatedTimeRemaining / 60)}h {estimatedTimeRemaining % 60}m remaining</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Linear Progress Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-3 relative overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-700 ease-out relative" 
                      style={{ width: `${courseProgress.percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                    </div>
                  </div>

                  {/* Milestone Indicators */}
                  <div className="flex justify-between items-center relative">
                    {milestones.map((milestone, index) => (
                      <div key={index} className="flex flex-col items-center relative group">
                        <div 
                          className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                            milestone.reached 
                              ? 'bg-indigo-500 border-indigo-400 scale-125' 
                              : courseProgress.percentage >= milestone.percentage
                              ? 'bg-indigo-400 border-indigo-300'
                              : 'bg-gray-600 border-gray-500'
                          }`}
                        >
                          {milestone.reached && (
                            <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-75"></div>
                          )}
                        </div>
                        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                          {milestone.title} ({milestone.percentage}%)
                        </div>
                      </div>
                    ))}
                    {/* Connecting line */}
                    <div className="absolute top-1.5 left-0 right-0 h-0.5 bg-gray-600 -z-10"></div>
                  </div>
                </div>
              )}

              {/* Q&A Tab */}
              {activeTab === 'qa' && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Questions & Answers</h3>
                  <div className="space-y-4">
                    {/* Question Input */}
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-3">Ask a Question</h4>
                      <textarea
                        placeholder="Have a question about this lesson? Ask here..."
                        className="w-full h-20 bg-gray-600 text-white p-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
                      />
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-xs text-gray-400">Questions are reviewed by instructors</span>
                        <button className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          Submit Question
                        </button>
                      </div>
                    </div>

                    {/* Sample Q&A */}
                    <div className="space-y-4">
                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                            JD
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-white">John Doe</span>
                              <span className="text-xs text-gray-400">2 days ago</span>
                            </div>
                            <p className="text-gray-300 text-sm">
                              How does this concept apply to daily life situations?
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 ml-11 bg-gray-600 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-indigo-400">Dr. Joshua Todd</span>
                            <span className="text-xs bg-indigo-600 px-2 py-0.5 rounded-full">Instructor</span>
                          </div>
                          <p className="text-gray-300 text-sm">
                            Great question! The principles we discuss can be applied through daily reflection and mindful awareness of your interactions with others.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resources Tab */}
              {activeTab === 'resources' && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Resources</h3>
                  <div className="space-y-6">
                    {/* Downloadable Materials */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 text-gray-300">Downloadable Materials</h4>
                      <div className="space-y-2">
                        <a href="#" className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
                            📄
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-white">Lesson Study Guide</div>
                            <div className="text-xs text-gray-400">PDF • 2.4 MB</div>
                          </div>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </a>
                      </div>
                    </div>

                    {/* Recommended Reading */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 text-gray-300">Recommended Reading</h4>
                      <div className="space-y-3">
                        <a href="#" className="block text-indigo-400 hover:text-indigo-300 text-sm">
                          📚 "The Art of Spiritual Growth" by John Doe
                        </a>
                        <a href="#" className="block text-indigo-400 hover:text-indigo-300 text-sm">
                          📖 "Understanding Divine Encounter" - Chapter 3
                        </a>
                      </div>
                    </div>

                    {/* External Links */}
                    <div>
                      <h4 className="text-sm font-medium mb-3 text-gray-300">Additional Resources</h4>
                      <div className="space-y-3">
                        <a href="#" className="block text-indigo-400 hover:text-indigo-300 text-sm">
                          🎥 Supplementary Video: "Practical Applications"
                        </a>
                        <a href="#" className="block text-indigo-400 hover:text-indigo-300 text-sm">
                          🧘 Guided Meditation: "Connecting with the Divine"
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Course Content Sidebar - Mobile Overlay / Desktop Optimized Width */}
        <div className={`
          fixed inset-0 lg:relative lg:flex-[0_0_30%] bg-gray-800 lg:border-l lg:border-gray-700
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
                  <div key={module._id} className="bg-gray-750 rounded-lg p-3 transition-all duration-200 hover:bg-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-white">{module.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {moduleProgress.completed}/{moduleProgress.total}
                        </span>
                        {modulePercentage === 100 && (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="text-white" size={12} />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Enhanced Module Progress Bar */}
                    <div className="relative mb-3">
                      <div className="w-full bg-gray-600 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-700 ease-out relative" 
                          style={{ width: `${modulePercentage}%` }}
                        >
                          {modulePercentage > 0 && (
                            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-400">{Math.round(modulePercentage)}% complete</span>
                        {moduleProgress.total - moduleProgress.completed > 0 && (
                          <span className="text-xs text-gray-500">
                            ~{(moduleProgress.total - moduleProgress.completed) * 15}m remaining
                          </span>
                        )}
                      </div>
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