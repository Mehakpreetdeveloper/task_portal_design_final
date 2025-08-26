-- Fix the security definer view issue by using security invoker
DROP VIEW IF EXISTS public.secure_profiles;

-- Create the view with security invoker (uses the permissions of the querying user)
CREATE VIEW public.secure_profiles AS
SELECT 
  p.id,
  p.user_id,
  p.created_at,
  p.updated_at,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.user_type,
  -- Phone number is only visible to the owner and admins through database policy
  CASE 
    WHEN p.user_id = auth.uid() THEN p.phone_number
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN p.phone_number
    ELSE NULL  -- Completely hide phone numbers from teammates
  END AS phone_number
FROM public.profiles p;

-- Set the view to use security invoker (default behavior, but being explicit)
ALTER VIEW public.secure_profiles SET (security_invoker = true);

-- Grant access to the secure view for authenticated users only
REVOKE ALL ON public.secure_profiles FROM PUBLIC;
GRANT SELECT ON public.secure_profiles TO authenticated;

-- The view will automatically respect the RLS policies of the underlying profiles table
-- This means users can only see profiles they have access to based on the profiles table policies

-- Update our functions to not use SECURITY DEFINER where possible
-- Keep the helper functions but make them more secure
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  first_name text,
  last_name text,
  avatar_url text,
  user_type user_type_enum,
  phone_number text
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Use security invoker instead of definer
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.created_at,
    p.updated_at,
    p.first_name,
    p.last_name,
    p.avatar_url,
    p.user_type,
    p.phone_number  -- Full access to own profile
  FROM profiles p
  WHERE p.user_id = auth.uid();
$$;