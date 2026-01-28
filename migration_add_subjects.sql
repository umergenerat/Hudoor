-- Migration: Add Subjects Table
-- Description: Creates subjects table for managing school subjects with proper RLS policies

-- Create Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Subjects

-- Policy: All authenticated users can view subjects
CREATE POLICY "Authenticated users can view subjects" ON public.subjects
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Admins can insert subjects
CREATE POLICY "Admins can insert subjects" ON public.subjects
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy: Admins can update subjects
CREATE POLICY "Admins can update subjects" ON public.subjects
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Policy: Admins can delete subjects
CREATE POLICY "Admins can delete subjects" ON public.subjects
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subjects_name ON public.subjects(name);

-- Insert some default subjects (optional - can be removed if not needed)
INSERT INTO public.subjects (name) VALUES
  ('Mathematics'),
  ('Physics'),
  ('Chemistry'),
  ('Biology'),
  ('Arabic'),
  ('French'),
  ('English'),
  ('History'),
  ('Geography'),
  ('Computer Science')
ON CONFLICT (name) DO NOTHING;
