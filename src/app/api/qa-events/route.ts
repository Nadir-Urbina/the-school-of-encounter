import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/sanity'

export async function POST(request: Request) {
  try {
    // Get the event data from the request
    const eventData = await request.json()
    
    // Check if user UID is provided
    if (!eventData.instructorUid) {
      return NextResponse.json(
        { error: 'Instructor UID is required' },
        { status: 400 }
      )
    }
    
    // Get instructor ID
    const instructorQuery = `*[_type == "instructor" && firebaseUID == $uid][0]._id`
    const instructorId = await serverClient.fetch(instructorQuery, { uid: eventData.instructorUid })
    
    if (!instructorId) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      )
    }
    
    // Create event document in Sanity
    const event = {
      _type: 'qaEvent',
      title: eventData.title,
      instructor: {
        _type: 'reference',
        _ref: instructorId
      },
      course: {
        _type: 'reference',
        _ref: eventData.courseId
      },
      startDateTime: eventData.startDateTime,
      endDateTime: eventData.endDateTime,
      description: eventData.description,
      meetingLink: eventData.meetingLink,
      isRecurring: eventData.isRecurring,
      recurringPattern: eventData.isRecurring ? eventData.recurringPattern : undefined
    }
    
    const createdEvent = await serverClient.create(event)
    
    return NextResponse.json(createdEvent, { status: 201 })
  } catch (error: any) {
    console.error('Error creating Q&A event:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    )
  }
} 