'use client'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  BookOpen, Calendar, LayoutDashboard, Shield, Users,
  GraduationCap, MessageSquare, LogOut, LogIn, UserPlus,
  BookMarked, CalendarDays, X, Menu
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive(href)
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`

  const publicLinks: NavItem[] = [
    { href: '/courses', label: 'Courses', icon: <BookOpen size={18} /> },
    { href: '/calendar', label: 'Q&A Calendar', icon: <Calendar size={18} /> },
  ]

  const studentLinks: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  ]

  const adminLinks: NavItem[] = [
    { href: '/admin', label: 'Admin Dashboard', icon: <Shield size={18} /> },
    { href: '/admin/courses', label: 'Manage Courses', icon: <BookMarked size={18} /> },
    { href: '/admin/users', label: 'Manage Users', icon: <Users size={18} /> },
    { href: '/admin/calendar', label: 'Calendar Admin', icon: <CalendarDays size={18} /> },
  ]

  const teacherLinks: NavItem[] = [
    { href: '/teacher-dashboard', label: 'Teacher Dashboard', icon: <GraduationCap size={18} /> },
    { href: '/teacher-dashboard/calendar', label: 'Manage Q&A', icon: <MessageSquare size={18} /> },
  ]

  const navLinks = (onNavigate?: () => void) => {
    const links: NavItem[] = [
      ...publicLinks,
      ...(user ? studentLinks : []),
      ...(user?.role === 'admin' ? adminLinks : []),
      ...(user?.role === 'teacher' ? teacherLinks : []),
    ]

    return links.map(({ href, label, icon }) => (
      <Link key={href} href={href} className={linkClass(href)} onClick={onNavigate}>
        {icon}
        {label}
      </Link>
    ))
  }

  const userInitial = user?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || '?'

  const sidebarContent = (onNavigate?: () => void) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-gray-100">
        <Link href="/" onClick={onNavigate}>
          <h1 className="text-base font-bold text-gray-900 leading-tight">
            The School<br />of Encounter
          </h1>
        </Link>
      </div>

      {/* User info */}
      {user && (
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-700 font-semibold text-sm">{userInitial}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navLinks(onNavigate)}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        {user ? (
          <button
            onClick={() => { handleLogout(); onNavigate?.() }}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        ) : (
          <>
            <Link href="/auth/login" className={linkClass('/auth/login')} onClick={onNavigate}>
              <LogIn size={18} /> Login
            </Link>
            <Link href="/auth/signup" className={linkClass('/auth/signup')} onClick={onNavigate}>
              <UserPlus size={18} /> Sign Up
            </Link>
          </>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-200 flex-col z-40">
        {sidebarContent()}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4">
        <Link href="/" className="text-base font-bold text-gray-900">
          The School of Encounter
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <aside className="fixed top-0 left-0 h-full w-72 bg-white z-50 md:hidden shadow-xl">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            {sidebarContent(() => setIsOpen(false))}
          </aside>
        </>
      )}
    </>
  )
}
