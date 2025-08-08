-- Add phone_number and user_type columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone_number TEXT;

-- Create an enum for user types to ensure data consistency
CREATE TYPE public.user_type_enum AS ENUM ('Designer', 'Marketing', 'Developer', 'WordPress', 'Shopify');

-- Add user_type column with enum type and default value
ALTER TABLE public.profiles 
ADD COLUMN user_type user_type_enum DEFAULT 'Developer';