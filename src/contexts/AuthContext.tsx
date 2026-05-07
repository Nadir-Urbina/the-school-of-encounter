'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserProfile } from '@/lib/user'
import Cookies from 'js-cookie'
import { createSanityUserProfile } from '@/app/actions/user'

interface AuthContextType {
  user: {
    uid: string
    email: string | null
    displayName: string | null
    role?: string
  } | null
  loading: boolean
  logout: () => Promise<void>
  signInWithGoogle: () => Promise<{ isNewUser: boolean }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  signInWithGoogle: async () => ({ isNewUser: false })
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let role = 'student'
        try {
          const profile = await getUserProfile(firebaseUser.uid)
          role = profile?.role || 'student'
        } catch {
          // profile fetch failed; default role is fine, user is still authenticated
        }
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role
        })
        Cookies.set('user', 'true', { secure: true })
      } else {
        setUser(null)
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

  const signInWithGoogle = async (): Promise<{ isNewUser: boolean }> => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const firebaseUser = result.user
      const isNewUser = getAdditionalUserInfo(result)?.isNewUser ?? false

      await createSanityUserProfile({
        firebaseUID: firebaseUser.uid,
        name: firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        role: 'student'
      })

      return { isNewUser }
    } catch (error) {
      console.error('Error in Google sign in:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 