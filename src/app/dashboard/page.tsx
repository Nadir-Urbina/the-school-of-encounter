'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserProfile } from '@/lib/user'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      if (user?.uid) {
        try {
          const userProfile = await getUserProfile(user.uid)
          setProfile(userProfile)
        } catch (error) {
          console.error('Error loading profile:', error)
        } finally {
          setLoadingProfile(false)
        }
      }
    }

    if (!loading) {
      if (!user) {
        router.replace('/auth/login')
      } else {
        loadProfile()
      }
    }
  }, [user, loading, router])

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading profile</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Continue your learning journey
          </p>
        </div>

        {/* Enrolled Courses */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Courses</h2>
          {profile.enrolledCourses?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.enrolledCourses.map((course: any) => (
                <div key={course._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {course.courseImage && (
                    <div className="relative h-48">
                      <Image
                        src={urlFor(course.courseImage).url()}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {course.description}
                    </p>
                    <a
                      href={`/learn/${course._id}`}
                      className="mt-4 inline-block text-blue-600 hover:text-blue-700"
                    >
                      Continue Learning →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <p className="text-gray-600">
                You haven't enrolled in any courses yet.
              </p>
              <a
                href="/courses"
                className="mt-4 inline-block text-blue-600 hover:text-blue-700"
              >
                Browse Available Courses →
              </a>
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-gray-900">{profile.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{profile.email}</p>
            </div>
            {profile.bio && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <p className="mt-1 text-gray-900">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

