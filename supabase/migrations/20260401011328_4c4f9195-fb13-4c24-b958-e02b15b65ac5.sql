
-- Allow authenticated users to insert clinics (for registration)
CREATE POLICY "Authenticated users can create clinics"
ON public.clinics FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to insert user_roles for themselves
CREATE POLICY "Users can insert their own role"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
