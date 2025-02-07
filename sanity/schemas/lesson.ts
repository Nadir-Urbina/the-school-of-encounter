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
      title: 'YouTube Video URL',
      type: 'url',
      description: 'Paste the unlisted YouTube video URL here'
    },
    {
      name: 'videoId',
      title: 'YouTube Video ID',
      type: 'string',
      description: 'Example: if URL is https://youtu.be/abc123xyz, the ID is abc123xyz'
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