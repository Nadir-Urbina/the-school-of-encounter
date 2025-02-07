import { Rule } from '@sanity/types'

export default {
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Course Title',
      type: 'string',
      validation: (Rule: Rule) => Rule.required()
    },
    {
      name: 'courseImage',
      title: 'Course Image',
      type: 'image',
      options: {
        hotspot: true // Enables UI for selecting what areas of an image should be cropped
      },
      validation: (Rule: Rule) => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' }
    },
    {
      name: 'instructors',
      title: 'Instructors',
      type: 'array',
      of: [{ 
        type: 'reference',
        to: [{ type: 'instructor' }]
      }],
      validation: (Rule: Rule) => Rule.required().min(1)
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text'
    },
    {
      name: 'modules',
      title: 'Modules',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'module' }] }]
    }
  ]
} 