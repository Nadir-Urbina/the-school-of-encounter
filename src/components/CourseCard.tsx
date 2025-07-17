import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/lib/sanity'
import { BorderBeam } from '@/components/magicui/border-beam'

// Helper function to format dates
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}

// Helper function to check if a course is not yet published
function isComingSoon(publishedAt: string | undefined): boolean {
  if (!publishedAt) return false;
  
  const now = new Date();
  const publishDate = new Date(publishedAt);
  return publishDate > now;
}

// TypeScript interface for Course
interface Course {
  _id: string
  title: string
  description: string
  shortDescription?: string
  slug: { current: string }
  courseImage: any
  instructors: { name: string; _id: string }[]
  rating?: number
  totalStudents?: number
  publishedAt?: string
  featuredCourse?: boolean
  price?: number
  level?: string
  categories?: string[]
  duration?: number
  lessonCount?: number
  learningOutcomes?: string[]
}

interface CourseCardProps {
  course: Course
}

export default function CourseCard({ course }: CourseCardProps) {
  const comingSoon = isComingSoon(course.publishedAt);
  
  // Level color mapping
  const getLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="group bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative">
      {/* Course Image with overlay and badges */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={urlFor(course.courseImage).url()}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Top badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {comingSoon && (
            <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              Coming {formatDate(course.publishedAt)}
            </span>
          )}
          {course.featuredCourse && !comingSoon && (
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              Featured
            </span>
          )}
          {course.level && (
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${getLevelColor(course.level)}`}>
              {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
            </span>
          )}
        </div>

        {/* Price badge */}
        {course.price !== undefined && !comingSoon && (
          <div className="absolute top-4 right-4">
            <span className="bg-white/90 backdrop-blur-sm text-gray-900 font-bold px-3 py-2 rounded-lg text-sm">
              {course.price === 0 ? 'Free' : `$${course.price}`}
            </span>
          </div>
        )}

        {/* Bottom info overlay */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center justify-between">
            {/* Duration and lessons */}
            <div className="flex items-center space-x-4 text-sm">
              {course.duration && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {course.duration}h
                </div>
              )}
              {course.lessonCount && (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-10 8h10M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {course.lessonCount} lessons
                </div>
              )}
            </div>
            
            {/* Rating */}
            {course.rating && (
              <div className="flex items-center">
                <div className="flex text-yellow-400 mr-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(course.rating || 0) ? 'fill-current' : 'fill-gray-400'
                      }`}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-medium">{course.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
          {course.title}
        </h3>

        {/* Instructors */}
        {course.instructors && course.instructors.length > 0 && (
          <p className="text-sm text-gray-600 mb-3 font-medium">
            By {course.instructors.map(instructor => instructor.name).join(', ')}
          </p>
        )}

        {/* Description */}
        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
          {course.shortDescription || course.description}
        </p>

        {/* Categories */}
        {course.categories && course.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {course.categories.slice(0, 2).map((category, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
              >
                {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            ))}
            {course.categories.length > 2 && (
              <span className="text-xs text-gray-500">
                +{course.categories.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Student count and social proof */}
        <div className="flex items-center justify-between mb-6">
          {course.totalStudents && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              {course.totalStudents.toLocaleString()} students
            </div>
          )}
          
          {/* Learning outcomes preview */}
          {course.learningOutcomes && course.learningOutcomes.length > 0 && (
            <div className="text-xs text-blue-600 font-medium">
              {course.learningOutcomes.length} learning outcomes
            </div>
          )}
        </div>

        {/* CTA Button */}
        <div className="flex items-center justify-between">
          <Link
            href={`/courses/${course.slug.current}`}
            className={`flex-1 text-center py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-300 ${
              comingSoon
                ? 'bg-gray-200 text-gray-600 cursor-default'
                : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            {comingSoon ? `Available ${formatDate(course.publishedAt)}` : 'Learn More'}
          </Link>
        </div>

        {/* Learning outcomes expanded on hover */}
        {course.learningOutcomes && course.learningOutcomes.length > 0 && (
          <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-h-0 group-hover:max-h-32 overflow-hidden">
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">What you'll learn:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {course.learningOutcomes.slice(0, 3).map((outcome, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-3 h-3 mr-2 mt-0.5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {outcome}
                  </li>
                ))}
                {course.learningOutcomes.length > 3 && (
                  <li className="text-blue-600 font-medium">
                    +{course.learningOutcomes.length - 3} more outcomes
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* BorderBeam - Only for featured courses */}
      {course.featuredCourse && (
        <BorderBeam 
          size={120}
          duration={6}
          colorFrom="#3B82F6"
          colorTo="#8B5CF6"
          borderWidth={2}
        />
      )}
    </div>
  )
} 