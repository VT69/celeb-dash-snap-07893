-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Only admins can view roles" ON public.user_roles;

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert you as an admin (replace with your actual user ID after you sign up/login)
-- You'll need to get your user_id from auth.users first
-- This is commented out - you'll add yourself via the backend after login