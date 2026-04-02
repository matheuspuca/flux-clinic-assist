
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view patients in their clinic" ON public.patients
  FOR SELECT TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()));

CREATE POLICY "Admins and atendentes can insert patients" ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (
    clinic_id = get_user_clinic_id(auth.uid())
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'atendente'))
  );

CREATE POLICY "Admins can update patients" ON public.patients
  FOR UPDATE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete patients" ON public.patients
  FOR DELETE TO authenticated
  USING (clinic_id = get_user_clinic_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Superadmins can view all patients" ON public.patients
  FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));
