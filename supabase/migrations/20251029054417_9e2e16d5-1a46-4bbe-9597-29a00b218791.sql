-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can view roles
CREATE POLICY "Only admins can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Drop old celebrity policies
DROP POLICY IF EXISTS "Authenticated users can create celebrities" ON public.celebrities;
DROP POLICY IF EXISTS "Authenticated users can update celebrities" ON public.celebrities;
DROP POLICY IF EXISTS "Authenticated users can delete celebrities" ON public.celebrities;

-- Create admin-only policies for celebrities
CREATE POLICY "Only admins can create celebrities"
ON public.celebrities
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update celebrities"
ON public.celebrities
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete celebrities"
ON public.celebrities
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update storage policies to admin-only
DROP POLICY IF EXISTS "Authenticated users can upload celebrity images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update celebrity images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete celebrity images" ON storage.objects;

CREATE POLICY "Only admins can upload celebrity images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'celebrity-images' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can update celebrity images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'celebrity-images' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can delete celebrity images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'celebrity-images' AND
  public.has_role(auth.uid(), 'admin')
);