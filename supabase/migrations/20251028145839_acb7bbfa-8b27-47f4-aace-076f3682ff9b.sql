-- Fix public data exposure in profiles table
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new policy that restricts viewing to authenticated users only
CREATE POLICY "Authenticated users can view profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);