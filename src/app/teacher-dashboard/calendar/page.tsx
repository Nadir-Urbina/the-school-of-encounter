'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import moment from 'moment'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/contexts/AuthContext'
import { client } from '@/lib/sanity'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = momentLocalizer(moment)

interface Course {
  _id: string
  title: string
}

interface QAEvent {
  _id: string
  title: string
  startDateTime: string
  endDateTime: string
  description?: string
  meetingLink?: string
  course: { _id: string; title: string }
  instructor: { _id: string; name: string }
  isRecurring: boolean
  recurringPattern?: string
}

export default function TeacherCalendar() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const defaultView = isMobile ? Views.WEEK : Views.MONTH
  const [newEvent, setNewEvent] = useState({
    title: '',
    courseId: '',
    startDateTime: '',
    endDateTime: '',
    description: '',
    meetingLink: '',
    isRecurring: false,
    recurringPattern: 'monthly'
  })

  // Check if user is logged in and is an instructor or admin
  useEffect(() => {
    if (!loading && (!user || (user.role !== 'teacher' && user.role !== 'admin'))) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // Fetch instructor's courses and Q&A events (or all courses/events for admin)
  useEffect(() => {
    if (user?.uid) {
      // Fetch courses taught by this instructor or all courses for admin
      const fetchCourses = async () => {
        let query = ''
        
        if (user.role === 'admin') {
          // Admin can see all courses
          query = `*[_type == "course"] {
            _id,
            title
          }`
        } else {
          // Teacher can only see their own courses
          query = `*[_type == "course" && references(*[_type == "instructor" && firebaseUID == $uid]._id)] {
            _id,
            title
          }`
        }
        
        try {
          const result = await client.fetch<Course[]>(query, { uid: user.uid })
          setCourses(result)
        } catch (error) {
          console.error('Error fetching courses:', error)
        }
      }

      // Fetch Q&A events for this instructor or all events for admin
      const fetchEvents = async () => {
        let query = ''
        
        if (user.role === 'admin') {
          // Admin can see all Q&A events
          query = `*[_type == "qaEvent"] {
            _id,
            title,
            startDateTime,
            endDateTime,
            description,
            meetingLink,
            "course": course->{_id, title},
            "instructor": instructor->{_id, name}
          }`
        } else {
          // Teacher can only see their own events
          query = `*[_type == "qaEvent" && instructor->firebaseUID == $uid] {
            _id,
            title,
            startDateTime,
            endDateTime,
            description,
            meetingLink,
            "course": course->{_id, title},
            "instructor": instructor->{_id, name}
          }`
        }
        
        try {
          const result = await client.fetch<QAEvent[]>(query, { uid: user.uid })
          
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

      fetchCourses()
      fetchEvents()
    }
  }, [user])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.uid) return

    try {
      // Create event using the API endpoint instead of direct Sanity client
      const response = await fetch('/api/qa-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructorUid: user.uid,
          title: newEvent.title,
          courseId: newEvent.courseId,
          startDateTime: new Date(newEvent.startDateTime).toISOString(),
          endDateTime: new Date(newEvent.endDateTime).toISOString(),
          description: newEvent.description,
          meetingLink: newEvent.meetingLink,
          isRecurring: newEvent.isRecurring,
          recurringPattern: newEvent.isRecurring ? newEvent.recurringPattern : undefined
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create event')
      }
      
      // Reset form and close dialog
      setNewEvent({
        title: '',
        courseId: '',
        startDateTime: '',
        endDateTime: '',
        description: '',
        meetingLink: '',
        isRecurring: false,
        recurringPattern: 'monthly'
      })
      
      setIsCreating(false)
      
      // Refresh events
      const fetchEvents = async () => {
        let query = ''
        
        if (user.role === 'admin') {
          // Admin can see all Q&A events
          query = `*[_type == "qaEvent"] {
            _id,
            title,
            startDateTime,
            endDateTime,
            description,
            meetingLink,
            "course": course->{_id, title},
            "instructor": instructor->{_id, name}
          }`
        } else {
          // Teacher can only see their own events
          query = `*[_type == "qaEvent" && instructor->firebaseUID == $uid] {
            _id,
            title,
            startDateTime,
            endDateTime,
            description,
            meetingLink,
            "course": course->{_id, title},
            "instructor": instructor->{_id, name}
          }`
        }
        
        try {
          const result = await client.fetch<QAEvent[]>(query, { uid: user.uid })
          
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
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  // Format date-time for input fields
  const formatDateTimeForInput = (date: Date) => {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      .toISOString()
      .slice(0, 16)
  }

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setIsCreating(true)
    setNewEvent({
      ...newEvent,
      startDateTime: formatDateTimeForInput(start),
      endDateTime: formatDateTimeForInput(end)
    })
  }

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">
          {user?.role === 'admin' ? 'Calendar Administration' : 'Manage Q&A Sessions'}
        </h1>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">Schedule New Q&A Session</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white shadow-xl">
            <DialogHeader>
              <DialogTitle>Schedule Q&A Session</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Select
                  value={newEvent.courseId}
                  onValueChange={(value) => setNewEvent({ ...newEvent, courseId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDateTime">Start Date & Time</Label>
                  <Input
                    id="startDateTime"
                    type="datetime-local"
                    value={newEvent.startDateTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startDateTime: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDateTime">End Date & Time</Label>
                  <Input
                    id="endDateTime"
                    type="datetime-local"
                    value={newEvent.endDateTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endDateTime: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meetingLink">Meeting Link</Label>
                <Input
                  id="meetingLink"
                  type="url"
                  value={newEvent.meetingLink}
                  onChange={(e) => setNewEvent({ ...newEvent, meetingLink: e.target.value })}
                  placeholder="https://zoom.us/..."
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecurring"
                  checked={newEvent.isRecurring}
                  onCheckedChange={(checked) => 
                    setNewEvent({ ...newEvent, isRecurring: checked as boolean })
                  }
                />
                <label
                  htmlFor="isRecurring"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  This is a recurring session
                </label>
              </div>
              
              {newEvent.isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="recurringPattern">Recurring Pattern</Label>
                  <Select
                    value={newEvent.recurringPattern}
                    onValueChange={(value) => setNewEvent({ ...newEvent, recurringPattern: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit">Schedule Session</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          selectable
          onSelectSlot={handleSelectSlot}
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
    </div>
  )
} 