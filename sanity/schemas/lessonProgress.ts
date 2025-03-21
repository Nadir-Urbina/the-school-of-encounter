export default {
  name: 'lessonProgress',
  title: 'Lesson Progress',
  type: 'document',
  fields: [
    {
      name: 'user',
      title: 'User',
      type: 'reference',
      to: [{ type: 'userProfile' }],
      validation: Rule => Rule.required()
    },
    {
      name: 'lesson',
      title: 'Lesson',
      type: 'reference',
      to: [{ type: 'lesson' }],
      validation: Rule => Rule.required()
    },
    {
      name: 'course',
      title: 'Course',
      type: 'reference',
      to: [{ type: 'course' }],
      validation: Rule => Rule.required(),
      description: 'The course this lesson belongs to (for easier querying)'
    },
    {
      name: 'completed',
      title: 'Completed',
      type: 'boolean',
      initialValue: false
    },
    {
      name: 'watchedPercentage',
      title: 'Watched Percentage',
      type: 'number',
      validation: Rule => Rule.min(0).max(100),
      initialValue: 0
    },
    {
      name: 'lastWatched',
      title: 'Last Watched',
      type: 'datetime'
    },
    {
      name: 'notes',
      title: 'Notes',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'User notes for this lesson'
    }
  ],
  indexes: [
    {
      name: 'userLesson',
      spec: {
        fields: ['user', 'lesson'],
        unique: true
      }
    }
  ]
} 