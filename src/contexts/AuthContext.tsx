'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserProfile } from '@/lib/user'
import Cookies from 'js-cookie'

interface AuthContextType {
  user: (User & { role?: string }) | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(User & { role?: string }) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get additional user data from Sanity
        const profile = await getUserProfile(firebaseUser.uid)
        const enrichedUser = {
          ...firebaseUser,
          role: profile?.role || 'student'
        }
        setUser(enrichedUser)
        // Set cookie for middleware
        Cookies.set('user', 'true', { secure: true })
      } else {
        setUser(null)
        // Remove cookie when logged out
        Cookies.remove('user')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    try {
      await signOut(auth)
      Cookies.remove('user')
      setUser(null)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 