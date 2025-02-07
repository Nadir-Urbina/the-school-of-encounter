import { defineType, defineField } from '@sanity/types'

export default defineType({
  name: 'userProfile',
  title: 'User Profile',
  type: 'document',
  fields: [
    defineField({
      name: 'firebaseUID',
      title: 'Firebase UID',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'role',
      title: 'User Role',
      type: 'string',
      options: {
        list: [
          { title: 'Student', value: 'student' },
          { title: 'Teacher', value: 'teacher' },
          { title: 'Admin', value: 'admin' }
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'bio',
      title: 'Biography',
      type: 'text'
    }),
    defineField({
      name: 'avatar',
      title: 'Profile Picture',
      type: 'image',
      options: {
        hotspot: true
      }
    }),
    defineField({
      name: 'enrolledCourses',
      title: 'Enrolled Courses',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'course' }] }]
    })
  ]
}) 