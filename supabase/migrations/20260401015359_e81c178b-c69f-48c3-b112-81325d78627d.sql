
CREATE TABLE public.clinic_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL UNIQUE,
  -- WhatsApp
  evolution_api_url text,
  evolution_api_key text,
  evolution_instance text,
  whatsapp_enabled boolean NOT NULL DEFAULT false,
  -- Chatbot
  welcome_message text DEFAULT 'Olá! 👋 Sou a assistente virtual. Como posso ajudar?',
  extra_instructions text,
  chatbot_site_enabled boolean NOT NULL DEFAULT true,
  chatbot_whatsapp_enabled boolean NOT NULL DEFAULT false,
  -- Notifications
  notify_confirmation_whatsapp boolean NOT NULL DEFAULT false,
  notify_reminder_24h boolean NOT NULL DEFAULT false,
  notify_reminder_2h boolean NOT NULL DEFAULT false,
  confirmation_message_template text DEFAULT 'Olá {patient_name}! Seu agendamento para {service_name} com {professional_name} está confirmado para {date} às {time}. Clínica {clinic_name}.',
  -- Clinic extra info
  phone text,
  address text,
  business_hours jsonb DEFAULT '{"seg":{"open":"08:00","close":"18:00"},"ter":{"open":"08:00","close":"18:00"},"qua":{"open":"08:00","close":"18:00"},"qui":{"open":"08:00","close":"18:00"},"sex":{"open":"08:00","close":"18:00"},"sab":{"open":"08:00","close":"12:00"},"dom":null}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings for their clinic"
ON public.clinic_settings FOR ALL TO authenticated
USING (clinic_id = get_user_clinic_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view settings for their clinic"
ON public.clinic_settings FOR SELECT TO authenticated
USING (clinic_id = get_user_clinic_id(auth.uid()));
