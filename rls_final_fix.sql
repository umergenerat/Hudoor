-- ROBUST RESET AND FIX FOR PROFILES RLS
-- This script uses a SECURITY DEFINER function to avoid recursion and repairs the admin profile.

-- 1. Create a security definer function to check admin role without recursion
-- This function runs with the privileges of the owner, bypassing RLS inside its own body.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Reset policies for profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profile selection policy" ON public.profiles;

-- 3. Create non-recursive policies
-- Users view own info
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins view all (uses the secure function)
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (is_admin());

-- Users update own info
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins update all
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (is_admin());

-- Admins delete
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (is_admin());

-- 4. MANUALLY REPAIR/CREATE THE ADMIN PROFILE
-- This ensures that your email has a valid admin profile in the profiles table.
-- Replace 'aomloutou@gmail.com' if your email in Supabase is different.
INSERT INTO public.profiles (id, display_name, role)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), 'admin'
FROM auth.users
WHERE email = 'aomloutou@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 5. VERIFY Data exists (Check the Result tab after running)
-- This query will show your profile if it was successfully created/updated.
SELECT * FROM public.profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'aomloutou@gmail.com');

-- DONE. Copy and Run this in Supabase SQL Editor.
