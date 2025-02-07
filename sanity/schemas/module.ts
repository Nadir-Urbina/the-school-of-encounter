export default {
  name: 'module',
  title: 'Module',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Module Title',
      type: 'string'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text'
    },
    {
      name: 'instructor',
      title: 'Module Instructor',
      type: 'reference',
      to: [{ type: 'instructor' }],
      description: 'Optional: Select an instructor specific to this module'
    },
    {
      name: 'lessons',
      title: 'Lessons',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'lesson' }] }]
    }
  ]
} 