export default {
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Lesson Title',
      type: 'string'
    },
    {
      name: 'videoUrl',
      title: 'Vimeo Video URL',
      type: 'url',
      description: 'Paste the Vimeo video URL here (e.g. https://vimeo.com/123456789)'
    },
    {
      name: 'videoId',
      title: 'Vimeo Video ID',
      type: 'string',
      description: 'Example: if URL is https://vimeo.com/123456789, the ID is 123456789'
    },
    {
      name: 'content',
      title: 'Additional Content',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image' },
        { type: 'file' }
      ]
    },
    {
      name: 'duration',
      title: 'Duration (minutes)',
      type: 'number'
    }
  ]
} 