-- Create professionals table
CREATE TABLE public.professionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view professionals in their clinic"
ON public.professionals
FOR SELECT
USING (clinic_id IN (
  SELECT clinic_id FROM public.profiles WHERE id = auth.uid()
));

CREATE POLICY "Admins can insert professionals in their clinic"
ON public.professionals
FOR INSERT
WITH CHECK (
  clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update professionals in their clinic"
ON public.professionals
FOR UPDATE
USING (
  clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete professionals in their clinic"
ON public.professionals
FOR DELETE
USING (
  clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Create trigger for updated_at
CREATE TRIGGER update_professionals_updated_at
BEFORE UPDATE ON public.professionals
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();