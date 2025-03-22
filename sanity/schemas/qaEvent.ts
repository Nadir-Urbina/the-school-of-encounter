import { Rule } from '@sanity/types';

export default {
  name: 'qaEvent',
  title: 'Q&A Session',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Session Title',
      type: 'string',
      validation: (Rule: Rule) => Rule.required()
    },
    {
      name: 'instructor',
      title: 'Instructor',
      type: 'reference',
      to: [{ type: 'instructor' }],
      validation: (Rule: Rule) => Rule.required()
    },
    {
      name: 'course',
      title: 'Related Course',
      type: 'reference',
      to: [{ type: 'course' }],
      validation: (Rule: Rule) => Rule.required()
    },
    {
      name: 'startDateTime',
      title: 'Start Date & Time',
      type: 'datetime',
      validation: (Rule: Rule) => Rule.required()
    },
    {
      name: 'endDateTime',
      title: 'End Date & Time',
      type: 'datetime',
      validation: (Rule: Rule) => Rule.required()
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Details about what will be covered in this Q&A session'
    },
    {
      name: 'meetingLink',
      title: 'Meeting Link',
      type: 'url',
      description: 'Zoom, Google Meet, or other video conferencing link'
    },
    {
      name: 'recordingLink',
      title: 'Recording Link',
      type: 'url',
      description: 'Link to the recording after the session (optional)',
    },
    {
      name: 'isRecurring',
      title: 'Is Recurring',
      type: 'boolean',
      description: 'Whether this is a recurring session',
      initialValue: false
    },
    {
      name: 'recurringPattern',
      title: 'Recurring Pattern',
      type: 'string',
      options: {
        list: [
          { title: 'Weekly', value: 'weekly' },
          { title: 'Bi-weekly', value: 'biweekly' },
          { title: 'Monthly', value: 'monthly' }
        ],
      },
      hidden: ({ document }: { document: any }) => !document?.isRecurring
    }
  ],
  preview: {
    select: {
      title: 'title',
      instructorName: 'instructor.name',
      courseName: 'course.title',
      startDate: 'startDateTime'
    },
    prepare({ title, instructorName, courseName, startDate }: any) {
      const date = startDate ? new Date(startDate).toLocaleDateString() : '';
      return {
        title: title,
        subtitle: `${instructorName || 'Instructor'} | ${courseName || 'Course'} | ${date}`
      };
    }
  }
} 