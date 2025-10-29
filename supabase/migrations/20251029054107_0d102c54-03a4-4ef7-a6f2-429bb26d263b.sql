-- Create storage bucket for celebrity images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'celebrity-images',
  'celebrity-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload celebrity images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'celebrity-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update celebrity images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'celebrity-images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete celebrity images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'celebrity-images');

-- Allow anyone to view images (public bucket)
CREATE POLICY "Anyone can view celebrity images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'celebrity-images');

-- Update celebrities table to allow authenticated users to manage
CREATE POLICY "Authenticated users can create celebrities"
ON public.celebrities
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update celebrities"
ON public.celebrities
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete celebrities"
ON public.celebrities
FOR DELETE
TO authenticated
USING (true);