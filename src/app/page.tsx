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
      courseImage
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
                className="relative bg-white/70 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden h-[300px]
                          transform transition-all duration-300 ease-in-out
                          hover:scale-[1.02] hover:shadow-2xl
                          group"
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.4)), url(${urlFor(course.courseImage).url()})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 p-6 flex flex-col justify-between
                                transition-all duration-300 ease-in-out
                                bg-black/20 group-hover:bg-black/10">
                  <h3 className="text-xl font-bold text-white
                                 transform transition-all duration-300
                                 group-hover:scale-105 group-hover:translate-y-2
                                 text-shadow-lg">
                    {course.title}
                  </h3>
                  <p className="text-gray-100 mb-6 
                                opacity-0 transform translate-y-4
                                transition-all duration-300 ease-in-out
                                group-hover:opacity-100 group-hover:translate-y-0
                                text-shadow">
                    {course.description}
                  </p>
                  <Link 
                    href={`/courses/${course.slug.current}`}
                    className="inline-block w-full text-center py-3 
                               bg-gradient-to-r from-blue-600 to-indigo-600 
                               text-white rounded-lg
                               transform transition-all duration-300
                               hover:from-blue-700 hover:to-indigo-700
                               hover:scale-[1.02] hover:shadow-lg
                               opacity-90 group-hover:opacity-100"
                  >
                    Learn More
                  </Link>
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

