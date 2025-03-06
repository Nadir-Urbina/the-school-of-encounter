'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/header'
import { Footer } from '@/components/footer'

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const isStudioPath = pathname?.startsWith('/studio');

  return (
    <>
      {!isStudioPath && <Header />}
      <main>{children}</main>
      {!isStudioPath && <Footer />}
    </>
  )
} 