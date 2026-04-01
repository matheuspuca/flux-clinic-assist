
-- Create a SECURITY DEFINER function to get user's clinic_id without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_clinic_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT clinic_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view profiles in their clinic" ON public.profiles;

-- Recreate it using the safe function
CREATE POLICY "Users can view profiles in their clinic"
ON public.profiles FOR SELECT
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

-- Also fix user_roles: the "Admins can manage roles" policy references profiles recursively
DROP POLICY IF EXISTS "Admins can manage roles in their clinic" ON public.user_roles;
CREATE POLICY "Admins can manage roles in their clinic"
ON public.user_roles FOR ALL
TO authenticated
USING (
  user_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.clinic_id = public.get_user_clinic_id(auth.uid())
  )
  AND public.has_role(auth.uid(), 'admin')
);

-- Fix professionals policies
DROP POLICY IF EXISTS "Users can view professionals in their clinic" ON public.professionals;
CREATE POLICY "Users can view professionals in their clinic"
ON public.professionals FOR SELECT
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert professionals in their clinic" ON public.professionals;
CREATE POLICY "Admins can insert professionals in their clinic"
ON public.professionals FOR INSERT
TO authenticated
WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update professionals in their clinic" ON public.professionals;
CREATE POLICY "Admins can update professionals in their clinic"
ON public.professionals FOR UPDATE
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete professionals in their clinic" ON public.professionals;
CREATE POLICY "Admins can delete professionals in their clinic"
ON public.professionals FOR DELETE
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Fix services policies
DROP POLICY IF EXISTS "Users can view services in their clinic" ON public.services;
CREATE POLICY "Users can view services in their clinic"
ON public.services FOR SELECT
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert services in their clinic" ON public.services;
CREATE POLICY "Admins can insert services in their clinic"
ON public.services FOR INSERT
TO authenticated
WITH CHECK (clinic_id = public.get_user_clinic_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update services in their clinic" ON public.services;
CREATE POLICY "Admins can update services in their clinic"
ON public.services FOR UPDATE
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete services in their clinic" ON public.services;
CREATE POLICY "Admins can delete services in their clinic"
ON public.services FOR DELETE
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Fix appointments policies
DROP POLICY IF EXISTS "Users can view appointments in their clinic" ON public.appointments;
CREATE POLICY "Users can view appointments in their clinic"
ON public.appointments FOR SELECT
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()));

DROP POLICY IF EXISTS "Admins and atendentes can insert appointments" ON public.appointments;
CREATE POLICY "Admins and atendentes can insert appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (
  clinic_id = public.get_user_clinic_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'))
);

DROP POLICY IF EXISTS "Admins and atendentes can update appointments" ON public.appointments;
CREATE POLICY "Admins and atendentes can update appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'))
);

DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;
CREATE POLICY "Admins can delete appointments"
ON public.appointments FOR DELETE
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Fix clinics policies
DROP POLICY IF EXISTS "Users can view their own clinic" ON public.clinics;
CREATE POLICY "Users can view their own clinic"
ON public.clinics FOR SELECT
TO authenticated
USING (id = public.get_user_clinic_id(auth.uid()));

DROP POLICY IF EXISTS "Admins can update their clinic" ON public.clinics;
CREATE POLICY "Admins can update their clinic"
ON public.clinics FOR UPDATE
TO authenticated
USING (id = public.get_user_clinic_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Fix chatbot_logs policies
DROP POLICY IF EXISTS "Admins can view chatbot logs in their clinic" ON public.chatbot_logs;
CREATE POLICY "Admins can view chatbot logs in their clinic"
ON public.chatbot_logs FOR SELECT
TO authenticated
USING (clinic_id = public.get_user_clinic_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- Fix professional_services policies
DROP POLICY IF EXISTS "Users can view professional services in their clinic" ON public.professional_services;
CREATE POLICY "Users can view professional services in their clinic"
ON public.professional_services FOR SELECT
TO authenticated
USING (
  professional_id IN (
    SELECT id FROM public.professionals WHERE clinic_id = public.get_user_clinic_id(auth.uid())
  )
);

DROP POLICY IF EXISTS "Admins can manage professional services in their clinic" ON public.professional_services;
CREATE POLICY "Admins can manage professional services in their clinic"
ON public.professional_services FOR ALL
TO authenticated
USING (
  professional_id IN (
    SELECT id FROM public.professionals WHERE clinic_id = public.get_user_clinic_id(auth.uid())
  )
  AND public.has_role(auth.uid(), 'admin')
);
