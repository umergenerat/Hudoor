-- Enable RLS
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- 1. DROP existing policies to avoid conflicts or stale definitions
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.attendance_records;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.attendance_records;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.attendance_records;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.attendance_records;

-- 2. Validate Policies
-- Allow ALL authenticated users (Admins & Teachers) to DELETE their records
CREATE POLICY "Enable delete for authenticated users" ON public.attendance_records
FOR DELETE
TO authenticated
USING (true);

-- Allow ALL authenticated users to UPDATE
CREATE POLICY "Enable update for authenticated users" ON public.attendance_records
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow ALL authenticated users to INSERT
CREATE POLICY "Enable insert for authenticated users" ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow ALL authenticated users to SELECT
CREATE POLICY "Enable read access for all users" ON public.attendance_records
FOR SELECT
TO authenticated
USING (true);
