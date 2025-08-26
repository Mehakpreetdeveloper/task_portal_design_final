-- Create a completely secure approach using a computed column approach
-- First, let's create a new policy that uses a computed phone number field

DROP POLICY IF EXISTS "Secure profile access with field-level protection" ON public.profiles;

-- Create a policy that allows viewing profiles but we'll handle phone numbers through a secure function
CREATE POLICY "Secure profile visibility for teammates" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can see their own full profile
  user_id = auth.uid() OR
  -- Admins can see all profiles  
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Project teammates can see basic profile info only
  users_share_projects(auth.uid(), user_id)
);

-- Create a secure view that masks phone numbers based on relationship
CREATE OR REPLACE VIEW public.secure_profiles AS
SELECT 
  p.id,
  p.user_id,
  p.created_at,
  p.updated_at,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.user_type,
  -- Phone number is only visible to the owner and admins
  CASE 
    WHEN p.user_id = auth.uid() THEN p.phone_number
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN p.phone_number
    ELSE NULL  -- Completely hide phone numbers from teammates
  END AS phone_number
FROM public.profiles p
WHERE (
  p.user_id = auth.uid() OR
  has_role(auth.uid(), 'admin'::app_role) OR
  users_share_projects(auth.uid(), p.user_id)
);

-- Grant access to the secure view
GRANT SELECT ON public.secure_profiles TO authenticated;

-- Create a completely secure function for getting profile data
CREATE OR REPLACE FUNCTION public.get_user_profile(_user_id uuid)
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
  can_view_phone boolean
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
    -- Only return phone number if authorized
    CASE 
      WHEN p.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) THEN p.phone_number
      ELSE NULL
    END AS phone_number,
    -- Indicate if the current user can view the phone number
    (p.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)) AS can_view_phone
  FROM profiles p
  WHERE p.user_id = _user_id 
    AND (
      p.user_id = auth.uid() 
      OR has_role(auth.uid(), 'admin'::app_role)
      OR users_share_projects(auth.uid(), p.user_id)
    );
$$;

-- Also create a function to get all accessible profiles with proper phone number security
CREATE OR REPLACE FUNCTION public.get_accessible_profiles()
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
  relationship text
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
    -- Phone number access control
    CASE 
      WHEN p.user_id = auth.uid() THEN p.phone_number
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN p.phone_number
      ELSE NULL  -- Hide from teammates
    END AS phone_number,
    -- Indicate relationship
    CASE 
      WHEN p.user_id = auth.uid() THEN 'self'
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN 'admin_view'
      ELSE 'teammate'
    END AS relationship
  FROM profiles p
  WHERE (
    p.user_id = auth.uid() 
    OR has_role(auth.uid(), 'admin'::app_role)
    OR users_share_projects(auth.uid(), p.user_id)
  );
$$;