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
    },
    {
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: (Rule: Rule) => Rule
        .min(0)
        .max(5)
        .precision(1) // Allows one decimal place
    },
    {
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (Rule: Rule) => Rule
        .required()
        .min(0)
        .precision(2) // Allows two decimal places for cents
    },
    {
      name: 'totalStudents',
      title: 'Total Students',
      type: 'number',
      validation: (Rule: Rule) => Rule
        .min(0)
        .integer() // Only whole numbers
    },
    
    // Tier 1 - Essential fields
    {
      name: 'status',
      title: 'Course Status',
      type: 'string',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Published', value: 'published' },
          { title: 'Archived', value: 'archived' }
        ],
        layout: 'radio'
      },
      initialValue: 'draft'
    },
    {
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      description: 'When the course will be available to students'
    },
    {
      name: 'level',
      title: 'Course Level',
      type: 'string',
      options: {
        list: [
          { title: 'Beginner', value: 'beginner' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' },
          { title: 'All Levels', value: 'all-levels' }
        ]
      }
    },
    {
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Spiritual Growth', value: 'spiritual-growth' },
          { title: 'Leadership', value: 'leadership' },
          { title: 'Prayer', value: 'prayer' },
          { title: 'Bible Study', value: 'bible-study' },
          { title: 'Ministry', value: 'ministry' }
        ]
      }
    },
    
    // Tier 2 - Marketing fields
    {
      name: 'shortDescription',
      title: 'Short Description',
      type: 'string',
      description: 'Brief summary for course cards (max 160 characters)',
      validation: (Rule: Rule) => Rule.max(160)
    },
    {
      name: 'learningOutcomes',
      title: 'Learning Outcomes',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'What students will learn from this course'
    },
    {
      name: 'featuredCourse',
      title: 'Featured Course',
      type: 'boolean',
      description: 'Highlight this course on the homepage',
      initialValue: false
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags'
      },
      description: 'Keywords to help with search and categorization'
    },
    
    // Academic field
    {
      name: 'credits',
      title: 'Credits',
      type: 'number',
      description: 'Number of credits awarded for completing this course',
      validation: (Rule: Rule) => Rule.min(0).precision(1)
    }
  ]
} 