-- Migration: Add new columns to students table based on Excel template requirements
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS national_id TEXT, -- For 'CIN'
ADD COLUMN IF NOT EXISTS first_name_ar TEXT, -- For 'Prénom Arabe'
ADD COLUMN IF NOT EXISTS last_name_ar TEXT, -- For 'Nom Arabe'
ADD COLUMN IF NOT EXISTS gender TEXT, -- For 'Sexe'
ADD COLUMN IF NOT EXISTS training_level TEXT, -- For 'Niveau de formation'
ADD COLUMN IF NOT EXISTS training_type TEXT, -- For 'Type de formation'
ADD COLUMN IF NOT EXISTS stream TEXT, -- For 'Filière'
ADD COLUMN IF NOT EXISTS cef TEXT; -- For 'CEF'
