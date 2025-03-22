'use client'

import { useState, useEffect } from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { client } from '@/lib/sanity'
import { isUserEnrolled } from '@/lib/enrollment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const localizer = momentLocalizer(moment)

interface QAEvent {
  _id: string
  title: string
  startDateTime: string
  endDateTime: string
  description?: string
  meetingLink?: string
  course: { _id: string; title: string; slug: { current: string } }
  instructor: { _id: string; name: string; image?: any }
  isRecurring: boolean
  recurringPattern?: string
}

export default function QACalendar() {
  const { user } = useAuth()
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<QAEvent | null>(null)
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [enrollmentStatus, setEnrollmentStatus] = useState<{[key: string]: boolean}>({})
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const defaultView = isMobile ? Views.WEEK : Views.MONTH

  useEffect(() => {
    const fetchEvents = async () => {
      const query = `*[_type == "qaEvent"] {
        _id,
        title,
        startDateTime,
        endDateTime,
        description,
        meetingLink,
        isRecurring,
        recurringPattern,
        "course": course->{
          _id, 
          title,
          slug
        },
        "instructor": instructor->{
          _id, 
          name,
          image
        }
      }`
      
      try {
        const result = await client.fetch<QAEvent[]>(query)
        
        // Format events for the calendar
        const formattedEvents = result.map(event => ({
          id: event._id,
          title: event.title,
          start: new Date(event.startDateTime),
          end: new Date(event.endDateTime),
          resource: event
        }))
        
        setEvents(formattedEvents)
      } catch (error) {
        console.error('Error fetching events:', error)
      }
    }

    fetchEvents()
  }, [])

  const handleSelectEvent = async (event: any) => {
    setSelectedEvent(event.resource)
    setIsEventDialogOpen(true)
    
    // Check enrollment status if user is logged in
    if (user?.uid && event.resource.course?._id) {
      setIsCheckingEnrollment(true)
      try {
        console.log('Checking enrollment for:', {
          firebaseUid: user.uid,
          courseId: event.resource.course._id,
          courseName: event.resource.course.title
        });
        
        const isEnrolled = await isUserEnrolled(user.uid, event.resource.course._id)
        console.log('Enrollment check result:', isEnrolled);
        
        setEnrollmentStatus(prev => ({
          ...prev,
          [event.resource.course._id]: isEnrolled
        }))
      } catch (error) {
        console.error('Error checking enrollment:', error)
      } finally {
        setIsCheckingEnrollment(false)
      }
    }
  }

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Function to format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Check if user is enrolled in the course
  const isEnrolledInCourse = (courseId: string) => {
    console.log('Checking enrollment status for course:', courseId);
    console.log('Current enrollmentStatus:', enrollmentStatus);
    return enrollmentStatus[courseId] || false
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Live Q&A Calendar</h1>
      <p className="text-gray-600 mb-8">
        View upcoming live Q&A sessions with our instructors. Click on an event to see details.
      </p>
      
      <div className="bg-white p-6 rounded-lg shadow mb-10">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          onSelectEvent={handleSelectEvent}
          defaultView={defaultView}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          eventPropGetter={(event) => {
            return {
              style: {
                backgroundColor: '#003ab8',
              }
            }
          }}
        />
      </div>
      
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>Q&A Session: {selectedEvent.title}</DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Course:</span> {selectedEvent.course.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Instructor:</span> {selectedEvent.instructor.name}
                    </p>
                  </div>
                  <Badge className="mt-2 md:mt-0 w-fit" variant={selectedEvent.isRecurring ? "outline" : "default"}>
                    {selectedEvent.isRecurring ? `Recurring: ${selectedEvent.recurringPattern}` : "One-time Session"}
                  </Badge>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">Date & Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm"><span className="font-medium">Date:</span> {formatDate(selectedEvent.startDateTime)}</p>
                    <p className="text-sm"><span className="font-medium">Time:</span> {formatTime(selectedEvent.startDateTime)} - {formatTime(selectedEvent.endDateTime)}</p>
                  </CardContent>
                </Card>
                
                {selectedEvent.description && (
                  <div className="mt-4">
                    <h3 className="text-md font-semibold mb-2">Session Details</h3>
                    <p className="text-sm text-gray-700">{selectedEvent.description}</p>
                  </div>
                )}
                
                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-end">
                  {isCheckingEnrollment ? (
                    <Button disabled variant="outline">Checking enrollment...</Button>
                  ) : user && enrollmentStatus[selectedEvent.course._id] === true ? (
                    // User is enrolled - show Join Meeting button if link exists, otherwise show a message
                    selectedEvent.meetingLink ? (
                      <a 
                        href={selectedEvent.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Join Meeting
                      </a>
                    ) : (
                      <Button disabled variant="outline">
                        Meeting link not available yet
                      </Button>
                    )
                  ) : (
                    // Not enrolled or not logged in - show View/Enroll
                    <a
                      href={`/courses/${selectedEvent.course.slug?.current}`}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {!user ? 'View Course' : 'Enroll in Course'}
                    </a>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setIsEventDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">About Q&A Sessions</h2>
        <p className="mb-4">
          Our instructors host regular live Q&A sessions to provide additional support and answer your questions about course material.
        </p>
        <p className="mb-4">
          These sessions are exclusive to enrolled students and provide a valuable opportunity to:
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li className="mb-2">Get clarification on challenging concepts</li>
          <li className="mb-2">Ask specific questions related to your learning journey</li>
          <li className="mb-2">Connect with instructors and fellow students</li>
          <li className="mb-2">Gain additional insights beyond the course material</li>
        </ul>
        <p>
          To join a Q&A session, you must be enrolled in the associated course. Browse our courses to learn more.
        </p>
      </div>
    </div>
  )
} 