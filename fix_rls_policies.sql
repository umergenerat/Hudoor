-- FIX RLS POLICIES FOR DATA PERSISTENCE
-- Run this in your Supabase SQL Editor

-- ============================================
-- CLASSES TABLE POLICIES
-- ============================================

-- Allow authenticated users to insert classes
CREATE POLICY "Authenticated users can insert classes" ON public.classes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update classes they created or admins
CREATE POLICY "Users can update their own classes" ON public.classes
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow users to delete classes they created or admins
CREATE POLICY "Users can delete their own classes" ON public.classes
  FOR DELETE USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- STUDENTS TABLE POLICIES
-- ============================================

-- Allow authenticated users to insert students
CREATE POLICY "Authenticated users can insert students" ON public.students
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update students in their classes or admins
CREATE POLICY "Users can update students" ON public.students
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR class_id = ANY(assigned_class_ids)))
  );

-- Allow admins to delete students
CREATE POLICY "Admins can delete students" ON public.students
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- ATTENDANCE RECORDS TABLE POLICIES
-- ============================================

-- Allow authenticated users to insert attendance records
CREATE POLICY "Authenticated users can insert attendance" ON public.attendance_records
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- APP SETTINGS TABLE POLICIES
-- ============================================

-- Allow all authenticated users to read app settings
CREATE POLICY "Authenticated users can read app settings" ON public.app_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow admins to insert app settings
CREATE POLICY "Admins can insert app settings" ON public.app_settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow admins to update app settings
CREATE POLICY "Admins can update app settings" ON public.app_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- PROFILES TABLE POLICIES (for updates)
-- ============================================

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- DONE! Now redeploy your app.
-- ============================================
