import { Rule } from '@sanity/types'

export default {
  name: 'testimonial',
  title: 'Testimonials',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule: Rule) => Rule.required()
    },
    {
      name: 'role',
      title: 'Role',
      type: 'string',
      validation: (Rule: Rule) => Rule.required()
    },
    {
      name: 'content',
      title: 'Content',
      type: 'text',
      validation: (Rule: Rule) => Rule.required()
    },
    {
      name: 'image',
      title: 'Profile Image',
      type: 'image',
      options: {
        hotspot: true
      }
    }
  ]
} 