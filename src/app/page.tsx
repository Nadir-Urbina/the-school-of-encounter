import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'
import { client, urlFor } from '@/lib/sanity'
import ContactForm from '@/components/ContactForm'

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
    *[_type == "course"][0...5] {
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
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
            Welcome to The School of Encounter
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-blue-100">
            Equipping you for spiritual growth and kingdom impact
          </p>
          <Link 
            href="/courses" 
            className="inline-block px-8 py-4 bg-white text-blue-700 rounded-lg font-semibold 
                     hover:bg-blue-50 transform hover:scale-105 transition-all duration-300 
                     shadow-lg hover:shadow-xl"
          >
            Explore Courses
          </Link>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-slate-100">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-center mb-12">
            Featured Courses
          </h2>
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
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">What Our Students Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial._id} className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="flex flex-col items-center">
                  {testimonial.image && (
                    <Image
                      src={urlFor(testimonial.image).width(100).height(100).url()}
                      alt={`${testimonial.name}'s profile picture`}
                      width={100}
                      height={100}
                      className="rounded-full mb-4"
                    />
                  )}
                  <CardTitle className="text-[#003ab8] text-center">{testimonial.name}</CardTitle>
                  <p className="text-gray-600 text-center">{testimonial.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-center">{testimonial.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Instructors Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Expert Teachers</h2>
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

      <section id="contact" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center text-[#003ab8]">Contact Us</h2>
          <ContactForm />
        </div>
      </section>
    </div>
  )
}

