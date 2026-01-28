-- COMPLETE RLS FIX FOR HUDOOR
-- This script resets and fixes all policies to ensure Teachers can see their assigned data.

-- 1. Enable RLS on all tables (just in case)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CLASSES TABLE POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view classes they are assigned to" ON public.classes;
DROP POLICY IF EXISTS "Authenticated users can select classes" ON public.classes;

CREATE POLICY "Users can view classes" ON public.classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role = 'admin' 
        OR public.classes.id = ANY(profiles.assigned_class_ids)
        OR public.classes.created_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert classes" ON public.classes;
CREATE POLICY "Admins and teachers can insert classes" ON public.classes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own classes" ON public.classes;
CREATE POLICY "Users can update classes" ON public.classes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'admin' OR public.classes.created_by = auth.uid())
    )
  );

-- ============================================
-- STUDENTS TABLE POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view students in their classes" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can select students" ON public.students;

CREATE POLICY "Users can view students" ON public.students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role = 'admin' 
        OR public.students.class_id = ANY(profiles.assigned_class_ids)
        OR EXISTS (SELECT 1 FROM public.classes WHERE id = public.students.class_id AND created_by = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
CREATE POLICY "Authenticated users can insert students" ON public.students
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update students" ON public.students;
CREATE POLICY "Users can update students" ON public.students
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 
      FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role = 'admin' 
        OR students.class_id = ANY(profiles.assigned_class_ids)
        OR EXISTS (SELECT 1 FROM public.classes WHERE id = public.students.class_id AND created_by = auth.uid())
      )
    )
  );

-- ============================================
-- ATTENDANCE RECORDS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Teachers can manage their own records" ON public.attendance_records;
DROP POLICY IF EXISTS "Authenticated users can manage attendance" ON public.attendance_records;

CREATE POLICY "Users can view attendance" ON public.attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role = 'admin' 
        OR EXISTS (SELECT 1 FROM public.students WHERE id = public.attendance_records.student_id AND class_id = ANY(profiles.assigned_class_ids))
        OR public.attendance_records.created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert attendance" ON public.attendance_records
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- PROFILES POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Profile selection policy" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() 
    OR role = 'admin'
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- DONE. Execute this in Supabase SQL Editor.
