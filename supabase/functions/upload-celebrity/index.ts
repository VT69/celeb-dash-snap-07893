import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const formData = await req.formData()
    const name = formData.get('name') as string
    const file = formData.get('file') as File

    if (!name || !file) {
      return new Response(
        JSON.stringify({ error: 'Name and file are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Cloudinary credentials
    const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')
    const apiKey = Deno.env.get('CLOUDINARY_API_KEY')
    const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')

    if (!cloudName || !apiKey || !apiSecret) {
      return new Response(
        JSON.stringify({ error: 'Cloudinary credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    const dataUrl = `data:${file.type};base64,${base64}`

    // Upload to Cloudinary
    const cloudinaryFormData = new FormData()
    cloudinaryFormData.append('file', dataUrl)
    cloudinaryFormData.append('upload_preset', 'ml_default') // You can change this to a specific preset
    cloudinaryFormData.append('api_key', apiKey)
    cloudinaryFormData.append('timestamp', String(Math.floor(Date.now() / 1000)))
    cloudinaryFormData.append('folder', 'celebrities')

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: cloudinaryFormData,
      }
    )

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.text()
      console.error('Cloudinary upload error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to upload image to Cloudinary' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cloudinaryData = await cloudinaryResponse.json()
    const publicUrl = cloudinaryData.secure_url

    // Insert into database
    const { error: dbError } = await supabase
      .from('celebrities')
      .insert({ name, image_url: publicUrl })

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to save to database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Celebrity added successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
