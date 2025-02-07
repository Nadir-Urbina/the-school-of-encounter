import Header from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TeacherDashboard() {
  const taughtCourses = [
    { title: 'Encounter 101', students: 150, revenue: 7500 },
    { title: 'Spiritual Warfare 101', students: 120, revenue: 6000 },
    { title: 'Kingdom Leadership', students: 80, revenue: 4000 },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Teacher Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {taughtCourses.map((course, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-2">Enrolled Students: {course.students}</p>
                <p className="text-gray-600">Revenue: ${course.revenue}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}

