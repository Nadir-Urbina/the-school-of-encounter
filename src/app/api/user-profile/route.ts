import { NextRequest, NextResponse } from 'next/server'
import { serverClient } from '@/lib/sanity'

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get('uid')
  if (!uid) return NextResponse.json(null)

  try {
    const profile = await serverClient.fetch(`
      *[_type == "userProfile" && firebaseUID == $uid][0] {
        _id,
        firebaseUID,
        name,
        email,
        role,
        bio,
        avatar,
        "enrolledCourses": enrolledCourses[]-> {
          _id,
          title,
          description,
          courseImage
        }
      }
    `, { uid })

    return NextResponse.json(profile ?? null)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(null, { status: 500 })
  }
}
