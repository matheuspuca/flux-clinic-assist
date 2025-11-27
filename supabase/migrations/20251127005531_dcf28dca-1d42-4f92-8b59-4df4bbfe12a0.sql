-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create professional_services junction table
CREATE TABLE public.professional_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(professional_id, service_id)
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  patient_email TEXT,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  origin TEXT NOT NULL DEFAULT 'manual' CHECK (origin IN ('manual', 'whatsapp', 'chatbot')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chatbot_logs table
CREATE TABLE public.chatbot_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_name TEXT,
  patient_phone TEXT,
  patient_email TEXT,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  intent TEXT,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services
CREATE POLICY "Users can view services in their clinic"
  ON public.services FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can insert services in their clinic"
  ON public.services FOR INSERT
  WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update services in their clinic"
  ON public.services FOR UPDATE
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete services in their clinic"
  ON public.services FOR DELETE
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for professional_services
CREATE POLICY "Users can view professional services in their clinic"
  ON public.professional_services FOR SELECT
  USING (
    professional_id IN (
      SELECT id FROM public.professionals 
      WHERE clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage professional services in their clinic"
  ON public.professional_services FOR ALL
  USING (
    professional_id IN (
      SELECT id FROM public.professionals 
      WHERE clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
    ) AND has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for appointments
CREATE POLICY "Users can view appointments in their clinic"
  ON public.appointments FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admins and atendentes can insert appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (
    clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()) 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'atendente'::app_role))
  );

CREATE POLICY "Admins and atendentes can update appointments"
  ON public.appointments FOR UPDATE
  USING (
    clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()) 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'atendente'::app_role))
  );

CREATE POLICY "Admins can delete appointments"
  ON public.appointments FOR DELETE
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for chatbot_logs
CREATE POLICY "Admins can view chatbot logs in their clinic"
  ON public.chatbot_logs FOR SELECT
  USING (clinic_id IN (SELECT clinic_id FROM public.profiles WHERE id = auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- Triggers
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable Realtime for appointments
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;