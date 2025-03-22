'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Laptop, BookOpen, Users, Calendar, Settings, ChevronRight } from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  const navigation = [
    {
      name: 'Dashboard',
      href: '/teacher-dashboard',
      icon: Laptop,
      current: pathname === '/teacher-dashboard'
    },
    {
      name: 'Courses',
      href: '/teacher-dashboard/courses',
      icon: BookOpen,
      current: pathname === '/teacher-dashboard/courses'
    },
    {
      name: 'Students',
      href: '/teacher-dashboard/students',
      icon: Users,
      current: pathname === '/teacher-dashboard/students'
    },
    {
      name: 'Q&A Sessions',
      href: '/teacher-dashboard/calendar',
      icon: Calendar,
      current: pathname === '/teacher-dashboard/calendar'
    },
    {
      name: 'Settings',
      href: '/teacher-dashboard/settings',
      icon: Settings,
      current: pathname === '/teacher-dashboard/settings'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-[#003ab8]">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Link href="/" className="text-xl font-bold text-white">
                School of Encounter
              </Link>
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-md font-medium rounded-md
                    ${item.current
                      ? 'bg-[#0047e1] text-white'
                      : 'text-blue-100 hover:bg-[#0047e1] hover:text-white'}
                  `}
                >
                  <item.icon
                    className={`
                      mr-3 flex-shrink-0 h-6 w-6
                      ${item.current
                        ? 'text-white'
                        : 'text-blue-300 group-hover:text-white'}
                    `}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-blue-800 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div>
                  <div className="h-9 w-9 rounded-full bg-blue-700 flex items-center justify-center text-white font-semibold">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {user?.displayName || user?.email || 'Instructor'}
                  </p>
                  <Link
                    href="/teacher-dashboard/profile"
                    className="text-xs font-medium text-blue-200 group-hover:text-white flex items-center"
                  >
                    View Profile <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden bg-[#003ab8] text-white p-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            School of Encounter
          </Link>
          <div className="flex items-center space-x-4">
            {/* Mobile menu button would go here */}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
} 