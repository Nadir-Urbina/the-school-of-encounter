export default {
    name: 'enrollment',
    title: 'Enrollment',
    type: 'document',
    fields: [
      {
        name: 'student',
        title: 'Student',
        type: 'reference',
        to: [{ type: 'userProfile' }]
      },
      {
        name: 'course',
        title: 'Course',
        type: 'reference',
        to: [{ type: 'course' }]
      },
      {
        name: 'enrolledAt',
        title: 'Enrolled At',
        type: 'datetime'
      },
      {
        name: 'status',
        title: 'Status',
        type: 'string',
        options: {
          list: [
            { title: 'Active', value: 'active' },
            { title: 'Completed', value: 'completed' },
            { title: 'Cancelled', value: 'cancelled' }
          ]
        }
      },
      {
        name: 'paymentId',
        title: 'Payment ID',
        type: 'string'
      }
    ]
  }