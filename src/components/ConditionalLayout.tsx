'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/header'
import { Footer } from '@/components/footer'

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const hideSidebar = pathname?.startsWith('/studio') || pathname?.startsWith('/learn')

  return (
    <>
      {!hideSidebar && <Header />}
      <main className={!hideSidebar ? 'md:ml-60 pt-14 md:pt-0' : ''}>
        {children}
      </main>
      {!hideSidebar && <Footer />}
    </>
  )
}
