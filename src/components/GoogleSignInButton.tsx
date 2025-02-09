'use client'
import { FcGoogle } from 'react-icons/fc'

interface GoogleSignInButtonProps {
  onClick: () => void
  label?: string
}

export default function GoogleSignInButton({ 
  onClick, 
  label = "Sign in with Google" 
}: GoogleSignInButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
    >
      <FcGoogle className="w-5 h-5" />
      <span>{label}</span>
    </button>
  )
} 