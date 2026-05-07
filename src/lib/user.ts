export async function getUserProfile(firebaseUID: string) {
  try {
    const response = await fetch(`/api/user-profile?uid=${encodeURIComponent(firebaseUID)}`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}
