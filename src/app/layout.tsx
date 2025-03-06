import { Inter, Montserrat } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ConditionalLayout from '@/components/ConditionalLayout'

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
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <Toaster position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  )
}

