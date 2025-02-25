import Image from 'next/image'
import Link from 'next/link'
import { client, urlFor } from '@/lib/sanity'

interface Course {
  _id: string
  title: string
  description: string
  slug: { current: string }
  courseImage: any
  instructors: { name: string }[]
  rating?: number
  totalStudents?: number
}

export default async function CoursesPage() {
  // Fetch all courses (removed the [0...5] limit)
  const courses = await client.fetch<Course[]>(`
    *[_type == "course"] {
      _id,
      title,
      description,
      slug,
      courseImage,
      "instructors": instructors[]->{ name },
      rating,
      totalStudents
    }
  `)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-center mb-12">
          Available Courses
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 
                        hover:shadow-lg transition-all duration-200"
            >
              {/* Course Image */}
              <div className="relative aspect-video">
                <Image
                  src={urlFor(course.courseImage).url()}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Course Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">
                  {course.title}
                </h3>

                {/* Instructors */}
                {course.instructors && (
                  <p className="text-sm text-gray-600 mb-2">
                    By {course.instructors.map(instructor => instructor.name).join(', ')}
                  </p>
                )}

                {/* Rating */}
                <div className="flex items-center mb-2">
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(course.rating || 0) ? 'fill-current' : 'fill-gray-300'
                        }`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  {course.rating && (
                    <span className="text-sm font-bold text-gray-700 ml-1">
                      {course.rating.toFixed(1)}
                    </span>
                  )}
                  {course.totalStudents && (
                    <span className="text-sm text-gray-600 ml-1">
                      ({course.totalStudents.toLocaleString()} students)
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {course.description}
                </p>

                {/* Price and CTA */}
                <div className="flex items-center justify-between">
                  <Link
                    href={`/courses/${course.slug.current}`}
                    className="inline-flex items-center justify-center px-4 py-2 
                              border border-transparent rounded-md shadow-sm text-sm 
                              font-medium text-white bg-indigo-600 hover:bg-indigo-700 
                              focus:outline-none focus:ring-2 focus:ring-offset-2 
                              focus:ring-indigo-500"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

