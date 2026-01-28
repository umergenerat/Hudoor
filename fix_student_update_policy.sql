-- FIX STUDENT UPDATE POLICY
-- This fixes the "Error updating student" issue
-- Run this in your Supabase SQL Editor

-- First, drop the broken policy if it exists
DROP POLICY IF EXISTS "Users can update students" ON public.students;

-- Create the correct policy for updating students
CREATE POLICY "Users can update students" ON public.students
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE id = auth.uid() 
      AND (
        role = 'admin' 
        OR students.class_id = ANY(profiles.assigned_class_ids)
      )
    )
  );

-- Also ensure INSERT policy exists
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;

CREATE POLICY "Authenticated users can insert students" ON public.students
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Ensure DELETE policy exists
DROP POLICY IF EXISTS "Admins can delete students" ON public.students;

CREATE POLICY "Admins can delete students" ON public.students
  FOR DELETE USING (
    EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
