'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook to detect if a media query matches
 * @param query The media query to match against (e.g., '(max-width: 768px)')
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false on the server
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Check if window exists (client-side only)
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query)
      
      // Set the initial value
      setMatches(media.matches)
      
      // Define the listener
      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches)
      }
      
      // Add the listener
      media.addEventListener('change', listener)
      
      // Clean up
      return () => {
        media.removeEventListener('change', listener)
      }
    }
  }, [query])
  
  return matches
} 