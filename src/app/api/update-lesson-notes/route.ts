import { NextResponse } from 'next/server'
import { serverClient } from '@/lib/sanity'

export async function POST(request: Request) {
  try {
    const { progressId, userId, lessonId, courseId, notes, lastWatched } = await request.json()

    // Validate required fields
    if (!userId || !lessonId || !courseId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let result

    // Update existing progress
    if (progressId) {
      result = await serverClient
        .patch(progressId)
        .set({
          notes,
          lastWatched
        })
        .commit()
    } 
    // Create new progress record
    else {
      result = await serverClient.create({
        _type: 'lessonProgress',
        user: {
          _type: 'reference',
          _ref: userId
        },
        lesson: {
          _type: 'reference',
          _ref: lessonId
        },
        course: {
          _type: 'reference',
          _ref: courseId
        },
        notes,
        completed: false,
        watchedPercentage: 0,
        lastWatched
      })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error updating lesson notes:', error)
    return NextResponse.json(
      { error: 'Failed to update notes' },
      { status: 500 }
    )
  }
} 