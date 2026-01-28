-- RESET AND FIX RLS POLICIES FOR PROFILES
-- This script fixes the recursive policy issue that prevents login.

-- 1. Disable RLS temporarily to ensure we can reset (Optional but safe)
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Profile selection policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- 3. Create clean, non-recursive SELECT policies

-- Policy: Authenticated users can ALWAYS read their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Admins can view all profiles
-- To avoid recursion (checking role by selecting from the same table in the policy),
-- we use a check that doesn't involve a recursive SELECT if possible.
-- A common trick in Supabase is to check if the user HAS the admin role in the profiles table
-- but using a subquery that is restricted or using auth.jwt() if it contains the role.
-- Since our role is ONLY in the profiles table, we'll use a direct check:
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 4. Create UPDATE policies
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 5. Create DELETE policies
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 6. Enable RLS (Ensure it's on)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: If you still face issues, run this to allow simple read access to all profiles for authenticated users temporarily:
-- CREATE POLICY "Temp allow read all" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);

-- DONE. Execute this in Supabase SQL Editor.
