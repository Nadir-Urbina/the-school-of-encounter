import { auth } from '@/lib/firebase'

export type User = {
  uid: string
  email: string | null
  displayName: string | null
}

export async function getCurrentUser(): Promise<User | null> {
  const user = auth.currentUser
  
  if (!user) {
    return null
  }

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName
  }
} 