export const uploadCelebrityToDatabase = async (name: string, file: File) => {
  const formData = new FormData()
  formData.append('name', name)
  formData.append('file', file)

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-celebrity`,
    {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
      }
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload celebrity')
  }

  return response.json()
}
