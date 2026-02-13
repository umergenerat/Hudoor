-- Enable RLS (already likely enabled, but good to be sure)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policy for reading settings (Everyone logged in)
CREATE POLICY "Enable read access for authenticated users" ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for managing settings (Admins only)
CREATE POLICY "Enable all access for admins" ON public.app_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
