import { Inter, Montserrat } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'
import Header from '@/components/header'
import { Footer } from '@/components/footer'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

const montserrat = Montserrat({ 
  subsets: ['latin'],
  variable: '--font-montserrat'
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${montserrat.variable} font-sans`}>
        <AuthProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <Toaster position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  )
}

