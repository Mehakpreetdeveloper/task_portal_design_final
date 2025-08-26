-- Enable RLS on the secure_profiles view explicitly
-- Views inherit RLS from underlying tables, but we'll make it explicit for the scanner
ALTER VIEW public.secure_profiles SET (security_barrier = true);

-- Drop and recreate as a more explicit secure view
DROP VIEW IF EXISTS public.secure_profiles;

-- Create a simple, secure view that clearly inherits RLS from profiles table
CREATE VIEW public.secure_profiles 
WITH (security_barrier = true, security_invoker = true) AS
SELECT 
  p.id,
  p.user_id,
  p.created_at,
  p.updated_at,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.user_type,
  -- Phone numbers are masked for non-owners through application logic
  -- The underlying RLS policy on profiles already restricts access
  CASE 
    WHEN p.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN p.phone_number
    ELSE NULL
  END AS phone_number,
  -- Add a flag to indicate if phone is visible
  (p.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)) as phone_visible
FROM public.profiles p;

-- The view automatically inherits RLS from the profiles table
-- Grant access only to authenticated users
GRANT SELECT ON public.secure_profiles TO authenticated;

-- Alternative approach: create a table-valued function instead of a view
-- This gives us more control and explicit RLS
CREATE OR REPLACE FUNCTION public.list_secure_profiles()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  first_name text,
  last_name text,
  avatar_url text,
  user_type user_type_enum,
  phone_number text,
  phone_visible boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
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
    CASE 
      WHEN p.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN p.phone_number
      ELSE NULL
    END AS phone_number,
    (p.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)) as phone_visible
  FROM public.profiles p
  -- This function will automatically respect the RLS policies on profiles table
$$;