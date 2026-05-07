import { NextRequest, NextResponse } from 'next/server'
import { serverClient } from '@/lib/sanity'

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get('uid')
  if (!uid) return NextResponse.json({ enrolledCourses: [], availableCourses: [] })

  try {
    const userDocId = await serverClient.fetch(
      `*[_type == "userProfile" && firebaseUID == $uid][0]._id`,
      { uid }
    )

    let enrolledCourses: any[] = []

    if (userDocId) {
      const enrolledData = await serverClient.fetch(`
        *[_type == "enrollment" && student._ref == $userDocId] {
          "course": course-> {
            _id,
            title,
            description,
            courseImage,
            "slug": slug.current,
            enrolledAt,
            status
          }
        }
      `, { userDocId })

      const courses = enrolledData.map((e: any) => e.course).filter(Boolean)

      enrolledCourses = await Promise.all(
        courses.map(async (course: any) => {
          try {
            const courseDetails = await serverClient.fetch(`
              *[_type == "course" && _id == $courseId][0] {
                _id,
                "modules": modules[]-> {
                  _id,
                  "lessons": lessons[]->
                }
              }
            `, { courseId: course._id })

            let totalLessons = 0
            courseDetails?.modules?.forEach((mod: any) => {
              totalLessons += mod.lessons?.length ?? 0
            })

            const completedLessons = await serverClient.fetch(`
              count(*[
                _type == "lessonProgress" &&
                user._ref == $userDocId &&
                course._ref == $courseId &&
                completed == true
              ])
            `, { userDocId, courseId: course._id })

            const progress = totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0

            return { ...course, progress, completedLessons, totalLessons }
          } catch {
            return { ...course, progress: 0, completedLessons: 0, totalLessons: 0 }
          }
        })
      )
    }

    const allCourses = await serverClient.fetch(`
      *[_type == "course"] {
        _id,
        title,
        description,
        courseImage,
        "price": price,
        "slug": slug.current,
        publishedAt
      }
    `)

    const enrolledIds = new Set(enrolledCourses.map((c: any) => c._id))
    const availableCourses = allCourses.filter((c: any) => !enrolledIds.has(c._id))

    return NextResponse.json({ enrolledCourses, availableCourses })
  } catch (error) {
    console.error('Error fetching user courses:', error)
    return NextResponse.json({ enrolledCourses: [], availableCourses: [] }, { status: 500 })
  }
}
