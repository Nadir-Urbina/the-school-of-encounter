'use client'
import { useEffect, useState, use, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { client } from '@/lib/sanity'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import Link from 'next/link'
import toast from 'react-hot-toast'

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

interface EnrolledStudent {
  _id: string
  email: string
  name: string
  enrolledAt: string
  status: string
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
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([])
  const [loadingCourse, setLoadingCourse] = useState(true)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const execFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const sendEmail = async () => {
    const htmlContent = editorRef.current?.innerHTML || ''
    if (!emailSubject.trim() || !htmlContent.trim() || htmlContent === '<br>') {
      toast.error('Please add a subject and message body.')
      return
    }

    setSendingEmail(true)
    try {
      const res = await fetch('/api/send-course-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          htmlContent,
          courseTitle: course?.title,
          senderName: user?.displayName || '',
          recipients: enrolledStudents
            .filter(s => s.email !== 'N/A')
            .map(s => ({ name: s.name, email: s.email }))
        })
      })

      if (res.ok) {
        const { sent } = await res.json()
        toast.success(`Email sent to ${sent} student${sent !== 1 ? 's' : ''}.`)
        setShowEmailModal(false)
        setEmailSubject('')
        if (editorRef.current) editorRef.current.innerHTML = ''
      } else {
        toast.error('Failed to send email. Please try again.')
      }
    } catch {
      toast.error('Failed to send email. Please try again.')
    } finally {
      setSendingEmail(false)
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
              "userId": user._ref,
              "lessonId": lesson._ref
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
            if (!studentProgress[progress.userId]) {
              studentProgress[progress.userId] = new Set();
            }
            studentProgress[progress.userId].add(progress.lessonId);
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

        // Fetch enrolled students data
        let studentsData;
        try {
          studentsData = await client.fetch(`
            *[_type == "enrollment" && course._ref == $courseId] {
              _id,
              enrolledAt,
              status,
              "student": student-> {
                _id,
                email,
                name
              }
            } | order(enrolledAt desc)
          `, { courseId: resolvedParams.courseId });
        } catch (studentsError) {
          console.error('Error fetching enrolled students:', studentsError);
          studentsData = [];
        }

        // Transform the students data
        const enrolledStudentsData = (studentsData || []).map(enrollment => ({
          _id: enrollment._id,
          email: enrollment.student?.email || 'N/A',
          name: enrollment.student?.name || 'Unknown',
          enrolledAt: enrollment.enrolledAt,
          status: enrollment.status || 'active'
        }));

        setEnrolledStudents(enrolledStudentsData);

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
          <div className="p-6 sm:p-8 border-b">
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

          {/* Enrolled Students */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Enrolled Students</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {enrolledStudents.length} student{enrolledStudents.length !== 1 ? 's' : ''}
                </span>
                {enrolledStudents.length > 0 && (
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email Students
                  </button>
                )}
              </div>
            </div>
            
            {enrolledStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="text-lg font-medium mb-2">No students enrolled yet</p>
                <p className="text-sm">Students will appear here once they enroll in your course.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {enrolledStudents.map((student) => (
                  <div 
                    key={student._id}
                    className="bg-gray-50 rounded-lg p-4 border hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 font-medium text-sm">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {student.name}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Enrolled</p>
                          <p className="text-sm text-gray-900">
                            {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : student.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {student.status || 'active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Email Students</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Sending to {enrolledStudents.filter(s => s.email !== 'N/A').length} student{enrolledStudents.filter(s => s.email !== 'N/A').length !== 1 ? 's' : ''} enrolled in <span className="font-medium">{course?.title}</span>
                </p>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Subject */}
            <div className="px-6 pt-4">
              <input
                type="text"
                placeholder="Subject"
                value={emailSubject}
                onChange={e => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Editor */}
            <div className="px-6 pt-3 flex-1 flex flex-col min-h-0">
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-2 py-1.5 border border-b-0 border-gray-200 rounded-t-lg bg-gray-50">
                {[
                  { cmd: 'bold', icon: 'B', style: 'font-bold' },
                  { cmd: 'italic', icon: 'I', style: 'italic' },
                  { cmd: 'underline', icon: 'U', style: 'underline' },
                ].map(({ cmd, icon, style }) => (
                  <button
                    key={cmd}
                    onMouseDown={e => { e.preventDefault(); execFormat(cmd) }}
                    className={`w-8 h-8 text-sm ${style} text-gray-700 hover:bg-gray-200 rounded transition-colors`}
                  >
                    {icon}
                  </button>
                ))}
                <div className="w-px h-5 bg-gray-300 mx-1" />
                <button
                  onMouseDown={e => { e.preventDefault(); execFormat('insertUnorderedList') }}
                  className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded transition-colors"
                  title="Bullet list"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onMouseDown={e => { e.preventDefault(); execFormat('insertOrderedList') }}
                  className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-200 rounded transition-colors"
                  title="Numbered list"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01" />
                  </svg>
                </button>
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Write your message here..."
                className="flex-1 min-h-[200px] px-4 py-3 border border-gray-200 rounded-b-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent overflow-y-auto
                  empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t mt-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendEmail}
                disabled={sendingEmail}
                className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {sendingEmail ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send to All Students
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 