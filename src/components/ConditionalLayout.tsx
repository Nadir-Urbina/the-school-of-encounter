'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/header'
import MarketingHeader from '@/components/MarketingHeader'
import { Footer } from '@/components/footer'

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isStudioOrLearn = pathname?.startsWith('/studio') || pathname?.startsWith('/learn')
  const isHomepage = pathname === '/'

  if (isStudioOrLearn) {
    return <main>{children}</main>
  }

  if (isHomepage) {
    return (
      <>
        <MarketingHeader />
        <main className="pt-16">{children}</main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Sidebar />
      <main className="md:ml-60 pt-14 md:pt-0">{children}</main>
      <Footer />
    </>
  )
}
