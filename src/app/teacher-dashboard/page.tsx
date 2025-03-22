'use client'
import { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { client } from '@/lib/sanity'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'
import { updateInstructorBio, updateInstructorImage } from '@/app/actions/instructor'

interface Course {
  _id: string
  title: string
  courseImage: any
  description: string
  price: number
  totalStudents: number
  monthlyStudents: number // Current month
  expectedRevenue: number // Monthly revenue calculation
}

interface Instructor {
  _id: string
  name: string
  title: string
  bio: string
  email: string
  image: any
}

const MAX_BIO_LENGTH = 500;

export default function TeacherDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [updatedBio, setUpdatedBio] = useState('')
  const [bioCharacterCount, setBioCharacterCount] = useState(0)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }

    async function loadInstructorData() {
      try {
        console.log('Firebase UID:', user!.uid)

        // Get the instructor document using firebaseUID
        const instructorData = await client.fetch(`
          *[_type == "instructor" && firebaseUID == $uid][0] {
            _id,
            name,
            title,
            bio,
            email,
            image
          }
        `, { uid: user!.uid })

        console.log('Instructor doc:', instructorData)

        if (instructorData) {
          setInstructor(instructorData)
          setUpdatedBio(instructorData.bio || '')
          setBioCharacterCount(instructorData.bio?.length || 0)
        }

        if (!instructorData) {
          console.error('No instructor document found')
          return
        }

        const coursesData = await client.fetch(`
          *[_type == "course" && $instructorId in instructors[]._ref] {
            _id,
            title,
            courseImage,
            description,
            price,
            "totalStudents": count(*[_type == "enrollment" && course._ref == ^._id]),
            "monthlyStudents": count(*[
              _type == "enrollment" && 
              course._ref == ^._id && 
              dateTime(enrolledAt) >= dateTime(now()) - 60*60*24*30
            ]),
            "expectedRevenue": count(*[
              _type == "enrollment" && 
              course._ref == ^._id && 
              dateTime(enrolledAt) >= dateTime(now()) - 60*60*24*30
            ]) * (price * 0.47)
          }
        `, {
          instructorId: instructorData._id
        })

        console.log('Courses found:', coursesData)
        setCourses(coursesData)
      } catch (error) {
        console.error('Error loading instructor data:', error)
      } finally {
        setLoadingCourses(false)
      }
    }

    loadInstructorData()
  }, [user, loading, router])

  const handleBioChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    // Only update if within character limit
    if (text.length <= MAX_BIO_LENGTH) {
      setUpdatedBio(text);
      setBioCharacterCount(text.length);
    }
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image is too large. Please select an image under 5MB')
        return
      }
      
      setSelectedImage(file)
      
      // Show loading indicator while creating preview
      const loadingToast = toast.loading('Preparing image preview...')
      
      // Create preview URL for the selected image
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        toast.dismiss(loadingToast)
      }
      reader.onerror = () => {
        toast.dismiss(loadingToast)
        toast.error('Failed to read image file')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!instructor?._id) return

    setIsSubmitting(true)
    toast.loading('Updating your profile...')

    try {
      // Update the bio via server action
      const bioUpdate = await updateInstructorBio(instructor._id, updatedBio)
      
      if (!bioUpdate.success) {
        throw new Error(bioUpdate.error || 'Failed to update bio')
      }

      // Upload the image if a new one was selected
      if (selectedImage && imagePreview) {
        const imageUpdate = await updateInstructorImage(
          instructor._id, 
          imagePreview
        )
        
        if (!imageUpdate.success) {
          throw new Error(imageUpdate.error || 'Failed to upload image')
        }
      }
      
      // Refresh the instructor data
      const updatedInstructor = await client.fetch(`
        *[_type == "instructor" && _id == $id][0] {
          _id,
          name,
          title,
          bio,
          email,
          image
        }
      `, { id: instructor._id })
      
      setInstructor(updatedInstructor)
      setEditMode(false)
      setSelectedImage(null)
      setImagePreview(null)
      
      toast.dismiss()
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.dismiss()
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || loadingCourses) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading your dashboard...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your courses and track student progress</p>
        </div>

        {/* Instructor Profile Section */}
        <div className="bg-white rounded-lg shadow-sm mb-8 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Profile</h2>
            
            {!editMode ? (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/4">
                  {instructor?.image ? (
                    <div className="relative h-60 w-60 mx-auto">
                      <Image
                        src={urlFor(instructor.image).width(240).height(240).url()}
                        alt={instructor.name}
                        width={240}
                        height={240}
                        className="rounded-lg object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-60 w-60 bg-gray-200 rounded-lg flex items-center justify-center mx-auto">
                      <span className="text-gray-500">No profile image</span>
                    </div>
                  )}
                </div>
                
                <div className="w-full md:w-3/4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-lg font-medium">{instructor?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Title</p>
                      <p className="text-lg font-medium">{instructor?.title || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-lg font-medium">{instructor?.email || 'Not set'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Bio</p>
                    <p className="text-gray-700 whitespace-pre-line">{instructor?.bio || 'No bio available'}</p>
                  </div>
                  
                  <div className="mt-6">
                    <Button
                      onClick={() => setEditMode(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/4">
                    {imagePreview ? (
                      <div className="relative h-60 w-60 mx-auto">
                        <Image
                          src={imagePreview}
                          alt="Profile preview"
                          width={240}
                          height={240}
                          className="rounded-lg object-cover"
                        />
                      </div>
                    ) : instructor?.image ? (
                      <div className="relative h-60 w-60 mx-auto">
                        <Image
                          src={urlFor(instructor.image).width(240).height(240).url()}
                          alt={instructor.name}
                          width={240}
                          height={240}
                          className="rounded-lg object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-60 w-60 bg-gray-200 rounded-lg flex items-center justify-center mx-auto">
                        <span className="text-gray-500">No profile image</span>
                      </div>
                    )}
                    
                    <div className="mt-4 text-center">
                      <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer gap-2 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Change Photo</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        Recommended: 240x240px or larger (max 5MB)
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-3/4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <Textarea
                        value={updatedBio}
                        onChange={handleBioChange}
                        rows={6}
                        placeholder="Tell us about yourself, your expertise, and your teaching philosophy..."
                        className={`resize-none ${bioCharacterCount >= MAX_BIO_LENGTH ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        maxLength={MAX_BIO_LENGTH}
                      />
                      <div className={`mt-1 text-sm flex justify-end ${
                        bioCharacterCount >= MAX_BIO_LENGTH ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {bioCharacterCount}/{MAX_BIO_LENGTH} characters
                        {bioCharacterCount >= MAX_BIO_LENGTH && (
                          <span className="ml-2">
                            (maximum reached)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-4 mt-6">
                      <Button
                        type="button"
                        onClick={() => {
                          setEditMode(false)
                          setUpdatedBio(instructor?.bio || '')
                          setSelectedImage(null)
                          setImagePreview(null)
                        }}
                        variant="outline"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        disabled={isSubmitting}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Course Stats Grid */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
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
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {course.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Total Students</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {course.totalStudents}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">New This Month</p>
                    <p className="text-2xl font-semibold text-indigo-600">
                      +{course.monthlyStudents}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expected Revenue</p>
                    <p className="text-2xl font-semibold text-green-600">
                      ${course.expectedRevenue?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>

                {/* Course Actions */}
                <div className="mt-6">
                  <Link
                    href={`/courses/${course._id}/manage`}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                  >
                    Manage Course →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
            <p className="mt-2 text-gray-600">
              You haven't created any courses yet.
            </p>
            <Link 
              href="/courses/create"
              className="inline-flex items-center px-4 py-2 border border-transparent 
                        rounded-md shadow-sm text-sm font-medium text-white 
                        bg-indigo-600 hover:bg-indigo-700"
            >
              Create Your First Course →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

