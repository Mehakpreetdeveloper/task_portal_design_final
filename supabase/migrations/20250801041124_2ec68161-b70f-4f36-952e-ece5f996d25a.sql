-- Add phone_number and user_type columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone_number TEXT,
ADD COLUMN user_type TEXT DEFAULT 'Developer';

-- Create an enum for user types to ensure data consistency
CREATE TYPE public.user_type_enum AS ENUM ('Designer', 'Marketing', 'Developer', 'WordPress', 'Shopify');

-- Update the user_type column to use the enum
ALTER TABLE public.profiles 
ALTER COLUMN user_type TYPE user_type_enum USING user_type::user_type_enum;