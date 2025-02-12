'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserProfile } from '@/lib/user'
import Cookies from 'js-cookie'
import { client } from '@/lib/sanity'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: {
    uid: string
    email: string | null
    role?: string
  } | null
  loading: boolean
  logout: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  signInWithGoogle: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get the user profile from Sanity to include the role
        const profile = await getUserProfile(firebaseUser.uid)
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: profile?.role || 'student'
        })
        
        Cookies.set('user', 'true', { secure: true })
      } else {
        setUser(null)
        Cookies.remove('user')
      }
      setLoading(false)
      
      // Force a refresh when auth state changes
      router.refresh()
    })

    return () => unsubscribe()
  }, [router])

  const logout = async () => {
    try {
      await signOut(auth)
      Cookies.remove('user')
      setUser(null)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      
      console.log('Google sign in successful, checking Sanity profile...')

      // Check if user profile exists in Sanity
      const profile = await client.fetch(
        `*[_type == "userProfile" && firebaseUID == $uid][0]`,
        { uid: user.uid }
      )
      
      console.log('Existing profile:', profile)

      if (!profile) {
        console.log('Creating new user profile in Sanity...')
        // Create new user profile in Sanity
        await client.create({
          _type: 'userProfile',
          firebaseUID: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          role: 'student', // default role
          enrolledCourses: [] // Initialize empty enrolled courses array
        })
        console.log('Sanity profile created')
      }
    } catch (error) {
      console.error('Error in Google sign in:', error)
      throw error // Re-throw to handle in the UI
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 