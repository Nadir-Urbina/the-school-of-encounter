import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { client, urlFor } from '@/lib/sanity'
import ContactForm from '@/components/ContactForm'
import CourseCard from '@/components/CourseCard'
import { BorderBeam } from '@/components/magicui/border-beam'

// Force dynamic rendering to always fetch fresh data
export const dynamic = "force-dynamic";

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

// Enhanced TypeScript interfaces
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

interface FeatureItem {
  icon: React.ReactNode
  title: string
  description: string
}

export const metadata = {
  title: "The School of Encounter - Transform Your Spiritual Journey",
  description: "Join thousands of students in transformative spiritual education. Expert-led courses, live Q&A sessions, and a supportive community await you.",
  openGraph: {
    title: "The School of Encounter - Transform Your Spiritual Journey",
    description: "Join thousands of students in transformative spiritual education. Expert-led courses, live Q&A sessions, and a supportive community await you.",
    url: "https://theschoolofencounter.com/",
    siteName: "The School of Encounter",
    images: [
      {
        url: "/HERO%20Image%20TSOE.png",
        width: 1200,
        height: 630,
        alt: "The School of Encounter Hero Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The School of Encounter - Transform Your Spiritual Journey",
    description: "Join thousands of students in transformative spiritual education. Expert-led courses, live Q&A sessions, and a supportive community await you.",
    images: ["/HERO%20Image%20TSOE.png"],
  },
}

export default async function Home() {
  // Enhanced data fetching with additional course information
  const courses = await client.fetch<Course[]>(`
    *[_type == "course"] | order(featuredCourse desc, publishedAt desc) {
      _id,
      title,
      description,
      shortDescription,
      slug,
      courseImage,
      "instructors": instructors[]->{ name, _id },
      rating,
      totalStudents,
      publishedAt,
      featuredCourse,
      price,
      level,
      categories,
      learningOutcomes,
      "lessonCount": count(modules[].lessons[])
    }[0...6]
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

  // Feature items for the "Why Choose Us" section
  const features: FeatureItem[] = [
    {
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Spiritual Transformation",
      description: "Experience deep, lasting change through biblically-grounded teachings that impact every area of your life"
    },
    {
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: "Thriving Community",
      description: "Connect with like-minded believers pursuing spiritual excellence in an encouraging, supportive environment"
    },
    {
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "Practical Wisdom",
      description: "Learn through real-world applications, interactive exercises, and ministry scenarios that prepare you for impact"
    },
    {
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: "Expert Guidance",
      description: "Access monthly live Q&A sessions and direct mentorship from seasoned spiritual leaders and teachers"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Enhanced Hero Section */}
      <section className="relative h-[80vh] flex items-center bg-gradient-to-br from-blue-900 via-purple-800 to-indigo-900 text-white overflow-visible pt-16">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="80%" fill="url(#hero-grid)" />
          </svg>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 py-8 sm:py-12 md:py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center overflow-visible">
            {/* Enhanced Headlines */}
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight sm:leading-relaxed pb-2 sm:pb-4" style={{ lineHeight: '1.2' }}>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-200">
                An Encounter-First Approach
              </span>
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-blue-100 to-white pb-1">
                To Learning
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-6 sm:mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Join hundreds of students in life-changing education with expert instructors that live what they teach.
            </p>

            <div className="mb-8 sm:mb-12 text-base sm:text-lg text-blue-200">
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Self-Paced Learning
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Live Q&A Sessions
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Lifetime Access
                </div>
              </div>
            </div>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="relative rounded-lg">
                <Link 
                  href="/courses" 
                  className="group px-8 py-4 bg-white text-blue-900 rounded-lg font-semibold text-lg
                            hover:bg-blue-50 transform hover:scale-105 transition-all duration-300 
                            shadow-xl hover:shadow-2xl inline-flex items-center min-w-[200px] justify-center relative"
                >
                  Start Learning Today
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <BorderBeam 
                  size={120}
                  duration={8}
                  colorFrom="#FFD700"
                  colorTo="#00FFFF"
                  borderWidth={3}
                />
              </div>
            </div>

            {/* Social Proof */}
            <div className="mt-16 pt-8 border-t border-white/20">
              <p className="text-blue-200 text-lg mb-4">Trusted by a growing community of Spirit-filled students worldwide</p>
              <div className="flex flex-wrap justify-center gap-8 text-white/80">
    
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Enhanced Featured Courses Section */}
      <section id="featured-courses" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Featured Courses
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Begin your transformation with our most popular and impactful courses, 
              designed by expert teachers to accelerate your spiritual growth
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/courses"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg
                        hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              View All Courses
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Enhanced Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose The School of Encounter
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience a comprehensive approach to spiritual education that transforms lives
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="group text-center p-8 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Student Success Stories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real transformations from our community of learners
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {testimonials.map((testimonial) => (
              <div 
                key={testimonial._id} 
                className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-2xl 
                           transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                {/* Quote Icon */}
                <div className="absolute -top-4 left-8">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                  </div>
                </div>
                
                <div className="pt-4">
                  <p className="text-gray-700 text-lg mb-6 italic leading-relaxed">"{testimonial.content}"</p>
                  
                  <div className="flex items-center">
                    {testimonial.image && (
                      <Image
                        src={urlFor(testimonial.image).width(48).height(48).url()}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="rounded-full mr-4 border-2 border-blue-100"
                      />
                    )}
                    <div>
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Instructors Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Learn from Expert Teachers
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our experienced instructors bring decades of ministry experience and academic excellence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {instructors.map((instructor) => (
              <div key={instructor._id} className="group text-center">
                <div className="relative overflow-hidden rounded-2xl mb-6 aspect-square">
                  {instructor.image && (
                    <Image
                      src={urlFor(instructor.image).width(300).height(300).url()}
                      alt={`${instructor.name}'s profile picture`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <p className="text-white text-sm leading-relaxed line-clamp-4">
                      {instructor.bio}
                    </p>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-blue-600 mb-2">{instructor.name}</h3>
                <p className="text-gray-600">{instructor.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to know about your learning journey
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                question: "How do the online courses work?",
                answer: "Our courses are self-paced and accessible 24/7. You'll get access to high-quality video lessons, downloadable resources, interactive assignments, and discussion forums. Complete them at your own pace and track your progress through our intuitive learning platform."
              },
              {
                question: "Will I get a certificate upon completion?",
                answer: "Yes! Upon successful completion of each course, you'll receive a beautiful digital certificate that you can share on social media, add to your LinkedIn profile, or include in your spiritual education portfolio."
              },
              {
                question: "Is there any deadline to complete a course?",
                answer: "Absolutely not! Our courses are designed for busy lives. Once enrolled, you have lifetime access to all course materials, updates, and community discussions. Learn at your own pace, whether that's in a few weeks or over several months."
              },
              {
                question: "What are the live Q&A sessions?",
                answer: "Every month, we host live video sessions where you can ask questions directly to our instructors. These interactive sessions are recorded and available to all students, creating a rich resource library of practical wisdom and guidance."
              },
              {
                question: "Do I need any prerequisites?",
                answer: "Most of our courses are designed for all levels, from beginners to advanced students. Each course page clearly indicates the recommended level and any suggested prerequisites. Our supportive community is always ready to help newcomers get started."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-8 hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Life?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of students already experiencing breakthrough in their spiritual journey
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              href="/courses"
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg
                        hover:bg-blue-50 transform hover:scale-105 transition-all duration-300
                        shadow-xl hover:shadow-2xl min-w-[200px] text-center"
            >
              Browse All Courses
            </Link>
            <Link
              href="/dashboard"
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-bold text-lg
                        hover:bg-white hover:text-blue-600 transition-all duration-300
                        shadow-lg hover:shadow-xl min-w-[200px] text-center"
            >
              Create Free Account
            </Link>
          </div>
          
          <p className="text-blue-200 text-lg">
            Start your journey today • No commitment required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-600 mb-6">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions about our courses or need guidance? We're here to help you on your spiritual journey.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>
    </div>
  )
}

