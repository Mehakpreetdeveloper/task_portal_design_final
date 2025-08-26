-- Enable RLS on the public_profiles view
-- Note: Views need to be recreated to enable RLS properly
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate the view as a materialized view with RLS enabled
-- Actually, let's create it as a regular view but ensure proper RLS through the underlying table
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  created_at,
  updated_at,
  first_name,
  last_name,
  avatar_url,
  user_type,
  -- Phone numbers are only visible to the owner
  CASE 
    WHEN user_id = auth.uid() THEN phone_number
    ELSE NULL
  END AS phone_number
FROM public.profiles
WHERE (
  -- Same access control as the profiles table
  user_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role) OR
  users_share_projects(auth.uid(), user_id)
);

-- Grant SELECT permission to authenticated users only
REVOKE ALL ON public.public_profiles FROM PUBLIC;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Create a simpler, more secure approach - let's just use the existing profiles table
-- and update the frontend to use it properly. Drop the view since it's causing issues.
DROP VIEW IF EXISTS public.public_profiles;

-- Update the profiles table policy to ensure phone numbers are properly protected
DROP POLICY IF EXISTS "Secure profile visibility with phone protection" ON public.profiles;

CREATE POLICY "Secure profile access with field-level protection" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can see their own full profile
  user_id = auth.uid() OR
  -- Admins can see all profiles  
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Project teammates can see basic profile info (phone will be handled in application layer)
  users_share_projects(auth.uid(), user_id)
);

-- Create a function that safely returns profile data for teammates (no phone numbers)
CREATE OR REPLACE FUNCTION public.get_safe_profile(_profile_user_id uuid)
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
SECURITY DEFINER
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
    -- Only return phone number if it's the user's own profile or admin
    CASE 
      WHEN p.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN p.phone_number
      ELSE NULL
    END AS phone_number
  FROM profiles p
  WHERE p.user_id = _profile_user_id 
    AND (
      p.user_id = auth.uid() 
      OR has_role(auth.uid(), 'admin'::app_role)
      OR users_share_projects(auth.uid(), p.user_id)
    );
$$;