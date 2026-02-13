-- Add subject_configs column to app_settings table
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS subject_configs JSONB DEFAULT '{}'::jsonb;

-- Update existing rows to have empty config if null
UPDATE public.app_settings 
SET subject_configs = '{}'::jsonb 
WHERE subject_configs IS NULL;
