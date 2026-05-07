'use client'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export default function MarketingHeader() {
  const { user } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-base font-bold text-gray-900">
          The School of Encounter
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link href="/courses" className="hover:text-gray-900 transition-colors">Courses</Link>
          {user && <Link href="/calendar" className="hover:text-gray-900 transition-colors">Q&amp;A Calendar</Link>}
          <Link href="/faq" className="hover:text-gray-900 transition-colors">FAQ</Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard">
              <Button size="sm">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
