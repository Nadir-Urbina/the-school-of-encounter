import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const courses = [
  {
    id: 1,
    title: 'Encounter 101',
    description: 'Learn the basics of spiritual encounters and how to cultivate a deeper relationship with God.',
    duration: '6 weeks',
    level: 'Beginner',
    price: 99,
  },
  {
    id: 2,
    title: 'Spiritual Warfare 101',
    description: 'Understand the principles of spiritual warfare and learn effective strategies for overcoming.',
    duration: '8 weeks',
    level: 'Intermediate',
    price: 129,
  },
  {
    id: 3,
    title: 'Birthing Intercession',
    description: 'Develop powerful intercessory prayer skills and learn how to pray with authority.',
    duration: '6 weeks',
    level: 'Intermediate',
    price: 99,
  },
  {
    id: 4,
    title: 'Bloodline Deliverance',
    description: 'Discover how to break free from generational curses and walk in freedom.',
    duration: '10 weeks',
    level: 'Advanced',
    price: 149,
  },
  {
    id: 5,
    title: 'Kingdom Leadership',
    description: 'Learn to lead with divine principles and authority in various spheres of influence.',
    duration: '12 weeks',
    level: 'Advanced',
    price: 199,
  },
  {
    id: 6,
    title: 'Prophetic Foundations',
    description: 'Explore the basics of the prophetic and how to hear God\'s voice clearly.',
    duration: '8 weeks',
    level: 'Beginner',
    price: 129,
  },
]

export default function CourseCatalog() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="font-heading text-4xl font-bold mb-12 text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Course Catalog
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <Card key={course.id} className="flex flex-col hover:shadow-xl transition-shadow duration-300 border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-heading bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {course.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-gray-600 mb-4">{course.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">Duration: {course.duration}</span>
                  <span className="text-sm text-gray-500">Level: {course.level}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-[#003ab8]">${course.price}</span>
                  <Button className="bg-[#003ab8] text-white hover:bg-[#002a85]">
                    Enroll Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2023 The School of Encounter. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

