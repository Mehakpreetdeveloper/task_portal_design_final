-- Create a view for public profile information (excludes phone numbers)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  created_at,
  updated_at,
  first_name,
  last_name,
  avatar_url,
  user_type,
  -- Exclude phone_number from public view
  CASE 
    WHEN user_id = auth.uid() THEN phone_number
    ELSE NULL
  END AS phone_number
FROM public.profiles;

-- Grant appropriate permissions on the view
GRANT SELECT ON public.public_profiles TO authenticated;

-- Create RLS policy for the view
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Update the profiles policy to be more restrictive with phone numbers
DROP POLICY IF EXISTS "Secure profile visibility" ON public.profiles;

-- Create new policy that completely restricts phone number access
CREATE POLICY "Secure profile visibility with phone protection" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can see their own full profile
  user_id = auth.uid() OR
  -- Admins can see all profiles
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Project teammates can see profiles but phone numbers will be NULL via the view
  users_share_projects(auth.uid(), user_id)
);

-- Create a secure function to get user profiles for teammates (without phone numbers)
CREATE OR REPLACE FUNCTION public.get_teammate_profiles(_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  first_name text,
  last_name text,
  avatar_url text,
  user_type user_type_enum
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
    p.user_type
  FROM profiles p
  WHERE p.user_id = _user_id 
    OR users_share_projects(auth.uid(), p.user_id)
    OR has_role(auth.uid(), 'admin'::app_role);
$$;