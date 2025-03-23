import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'
import { client, urlFor } from '@/lib/sanity'
import ContactForm from '@/components/ContactForm'

// Helper function to format dates
function formatDate(dateString: string | undefined): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  // Format as MM/DD/YYYY
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

interface Course {
  _id: string
  title: string
  description: string
  slug: { current: string }
  courseImage: any
  instructors: { name: string }[]
  rating?: number
  totalStudents?: number
  publishedAt?: string
  featuredCourse?: boolean
}

interface Instructor {
  _id: string
  name: string
  title: string
  bio: string
  image: any
}

interface Testimonial {
  _id: string
  name: string
  role: string
  content: string
  image: any
}

export default async function Home() {
  // Fetch data from Sanity
  const courses = await client.fetch<Course[]>(`
    *[_type == "course"] | order(featuredCourse desc, publishedAt desc) {
      _id,
      title,
      description,
      slug,
      courseImage,
      "instructors": instructors[]->{ name },
      rating,
      totalStudents,
      publishedAt
    }
  `)

  const instructors = await client.fetch<Instructor[]>(`
    *[_type == "instructor"] {
      _id,
      name,
      title,
      bio,
      image
    }
  `)

  const testimonials = await client.fetch<Testimonial[]>(`
    *[_type == "testimonial"] {
      _id,
      name,
      role,
      content,
      image
    }
  `)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section - Enhanced with background pattern and animation */}
      <section className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            {/* Add subtle grid pattern */}
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M0 32V0h32" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>
        <div className="container mx-auto px-4 text-center relative">
          <h1 className="font-heading text-5xl md:text-7xl font-bold mb-6 
                         bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100
                         animate-fade-in-up">
            Welcome to The School of Encounter
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-2xl mx-auto
                        opacity-0 animate-fade-in-up animation-delay-200">
            Equipping you for spiritual growth and kingdom impact
          </p>
          <Link 
            href="/courses" 
            className="inline-block px-8 py-4 bg-white text-blue-700 rounded-lg font-semibold 
                       hover:bg-blue-50 transform hover:scale-105 transition-all duration-300 
                       shadow-lg hover:shadow-xl opacity-0 animate-fade-in-up animation-delay-400"
          >
            Explore Courses
          </Link>
        </div>
      </section>

      {/* Featured Courses - Enhanced with card design */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-4xl font-bold text-center mb-4 text-gray-900">
            Featured Courses
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Begin your journey with our most popular and impactful courses
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div
                key={course._id}
                className="group bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 
                          hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Course Image with overlay */}
                <div className="relative aspect-video">
                  <Image
                    src={urlFor(course.courseImage).url()}
                    alt={course.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                    {course.title}
                  </h3>

                  {/* Instructors */}
                  {course.instructors && (
                    <p className="text-sm text-gray-600 mb-2">
                      By {course.instructors.map(instructor => instructor.name).join(', ')}
                    </p>
                  )}

                  {/* Coming Soon badge */}
                  {isComingSoon(course.publishedAt) && (
                    <div className="mb-2">
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">
                        Coming Soon - {formatDate(course.publishedAt)}
                      </span>
                    </div>
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
                      className={`inline-flex items-center justify-center px-4 py-2 
                                border border-transparent rounded-md shadow-sm text-sm 
                                font-medium ${isComingSoon(course.publishedAt) 
                                  ? 'text-gray-700 bg-gray-200 cursor-default' 
                                  : 'text-white bg-indigo-600 hover:bg-indigo-700'} 
                                focus:outline-none focus:ring-2 focus:ring-offset-2 
                                focus:ring-indigo-500`}
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Enhanced with modern card design */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4 text-center text-gray-900">What Our Students Say</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Real experiences from our community of learners
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div 
                key={testimonial._id} 
                className="relative bg-white rounded-xl p-8 shadow-sm hover:shadow-xl 
                           transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Decorative quote mark */}
                <div className="absolute top-4 right-4 text-blue-100">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 32 32">
                    <path d="M10 8v8H6v-8h4zm12 0v8h-4v-8h4z"/>
                  </svg>
                </div>
                
                <div className="relative">
                  {testimonial.image && (
                    <Image
                      src={urlFor(testimonial.image).width(64).height(64).url()}
                      alt={testimonial.name}
                      width={64}
                      height={64}
                      className="rounded-full mb-4 border-2 border-blue-100"
                    />
                  )}
                  <p className="text-gray-700 mb-4 italic">{testimonial.content}</p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instructors Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">Our Expert Teachers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {instructors.map((instructor) => (
              <div key={instructor._id} className="relative group">
                <Card className="transition-all duration-300 hover:shadow-lg overflow-hidden">
                  <CardHeader className="flex flex-col items-center">
                    {instructor.image && (
                      <Image
                        src={urlFor(instructor.image).width(200).height(200).url()}
                        alt={`${instructor.name}'s profile picture`}
                        width={200}
                        height={200}
                        className="rounded-full mb-4"
                      />
                    )}
                    <CardTitle className="text-[#003ab8] text-center">{instructor.name}</CardTitle>
                    <p className="text-gray-600 text-center">{instructor.title}</p>
                  </CardHeader>
                  <CardContent className="absolute inset-0 bg-[#003ab8] bg-opacity-90 text-white p-4 
                                        flex items-center justify-center opacity-0 group-hover:opacity-100 
                                        transition-opacity duration-300">
                    <p className="text-center line-clamp-6 text-sm">
                      {instructor.bio}
                      {instructor.bio && instructor.bio.length > 150 && (
                        <Link 
                          href={`/instructors/${instructor._id}`} 
                          className="block mt-2 underline hover:text-blue-200"
                        >
                          Read full bio
                        </Link>
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center text-gray-900">Why Choose The School of Encounter</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Spiritual Growth</h3>
              <p className="text-gray-600">Deepen your spiritual journey through practical and transformative teachings</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Community Learning</h3>
              <p className="text-gray-600">Join a vibrant community of believers pursuing spiritual excellence</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Practical Application</h3>
              <p className="text-gray-600">Learn through hands-on experience and real-world ministry scenarios</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Live Q&A Sessions</h3>
              <p className="text-gray-600">Gain access to monthly live Q&A sessions with all our instructors upon signup</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center text-gray-900">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-2">How do the online courses work?</h3>
              <p className="text-gray-600">Our courses are self-paced and accessible 24/7. You'll get access to video lessons, study materials, and interactive assignments. Complete them at your own pace and track your progress.</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-2">Will I get a certificate upon completion?</h3>
              <p className="text-gray-600">Yes! Upon successful completion of each course, you'll receive a digital certificate that you can share and add to your spiritual education portfolio.</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-2">Is there any deadline to complete a course?</h3>
              <p className="text-gray-600">No, our courses are designed to be flexible. Once enrolled, you have lifetime access to the course materials and can complete them at your own pace.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Begin Your Journey?</h2>
          <p className="text-xl text-blue-100 mb-8">Join thousands of students already learning with us</p>
          <Link
            href="/courses"
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold
                      hover:bg-blue-50 transform hover:scale-105 transition-all duration-300
                      shadow-lg hover:shadow-xl"
          >
            Browse All Courses
          </Link>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center text-[#003ab8]">Contact Us</h2>
          <ContactForm />
        </div>
      </section>

      {/* Footer would go here */}
    </div>
  )
}

