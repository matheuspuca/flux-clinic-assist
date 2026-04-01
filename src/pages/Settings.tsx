import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Building2, MessageSquare, Bell, Wifi, WifiOff, Copy, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const DAYS = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

const Settings = () => {
  const { toast } = useToast();
  const { clinic } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "connected" | "error">("idle");

  // Clinic data
  const [clinicForm, setClinicForm] = useState({ name: "", area: "", cnpj: "", phone: "", address: "" });
  const [businessHours, setBusinessHours] = useState<Record<string, { open: string; close: string } | null>>({});

  // Settings data
  const [settingsForm, setSettingsForm] = useState({
    evolution_api_url: "",
    evolution_api_key: "",
    evolution_instance: "",
    whatsapp_enabled: false,
    welcome_message: "",
    extra_instructions: "",
    chatbot_site_enabled: true,
    chatbot_whatsapp_enabled: false,
    notify_confirmation_whatsapp: false,
    notify_reminder_24h: false,
    notify_reminder_2h: false,
    confirmation_message_template: "",
  });

  const { data: clinicData, isLoading: loadingClinic } = useQuery({
    queryKey: ["clinic-detail", clinic?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .eq("id", clinic!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clinic?.id,
  });

  const { data: settingsData, isLoading: loadingSettings } = useQuery({
    queryKey: ["clinic-settings", clinic?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_settings")
        .select("*")
        .eq("clinic_id", clinic!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clinic?.id,
  });

  useEffect(() => {
    if (clinicData) {
      setClinicForm({
        name: clinicData.name || "",
        area: clinicData.area || "",
        cnpj: clinicData.cnpj || "",
        phone: "",
        address: "",
      });
    }
  }, [clinicData]);

  useEffect(() => {
    if (settingsData) {
      setSettingsForm({
        evolution_api_url: settingsData.evolution_api_url || "",
        evolution_api_key: settingsData.evolution_api_key || "",
        evolution_instance: settingsData.evolution_instance || "",
        whatsapp_enabled: settingsData.whatsapp_enabled ?? false,
        welcome_message: settingsData.welcome_message || "",
        extra_instructions: settingsData.extra_instructions || "",
        chatbot_site_enabled: settingsData.chatbot_site_enabled ?? true,
        chatbot_whatsapp_enabled: settingsData.chatbot_whatsapp_enabled ?? false,
        notify_confirmation_whatsapp: settingsData.notify_confirmation_whatsapp ?? false,
        notify_reminder_24h: settingsData.notify_reminder_24h ?? false,
        notify_reminder_2h: settingsData.notify_reminder_2h ?? false,
        confirmation_message_template: settingsData.confirmation_message_template || "",
      });
      setBusinessHours((settingsData.business_hours as Record<string, { open: string; close: string } | null>) || {});
      setClinicForm((prev) => ({
        ...prev,
        phone: settingsData.phone || "",
        address: settingsData.address || "",
      }));
    }
  }, [settingsData]);

  const saveClinicMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("clinics")
        .update({ name: clinicForm.name, area: clinicForm.area, cnpj: clinicForm.cnpj || null })
        .eq("id", clinic!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-detail"] });
      toast({ title: "Dados da clínica atualizados!" });
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        clinic_id: clinic!.id,
        ...settingsForm,
        phone: clinicForm.phone,
        address: clinicForm.address,
        business_hours: businessHours,
      };

      if (settingsData) {
        const { error } = await supabase
          .from("clinic_settings")
          .update(payload)
          .eq("clinic_id", clinic!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clinic_settings")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-settings"] });
      toast({ title: "Configurações salvas!" });
    },
    onError: (e) => {
      console.error(e);
      toast({ title: "Erro ao salvar configurações", variant: "destructive" });
    },
  });

  const testConnection = async () => {
    if (!settingsForm.evolution_api_url || !settingsForm.evolution_api_key || !settingsForm.evolution_instance) {
      toast({ title: "Preencha URL, API Key e Nome da Instância", variant: "destructive" });
      return;
    }
    setConnectionStatus("testing");
    try {
      const res = await fetch(
        `${settingsForm.evolution_api_url}/instance/connectionState/${settingsForm.evolution_instance}`,
        { headers: { apikey: settingsForm.evolution_api_key } }
      );
      if (res.ok) {
        const data = await res.json();
        setConnectionStatus(data?.instance?.state === "open" ? "connected" : "error");
      } else {
        setConnectionStatus("error");
      }
    } catch {
      setConnectionStatus("error");
    }
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateBusinessHour = (day: string, field: "open" | "close", value: string) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: prev[day] ? { ...prev[day]!, [field]: value } : { open: "08:00", close: "18:00", [field]: value },
    }));
  };

  const toggleDay = (day: string) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: prev[day] ? null : { open: "08:00", close: "18:00" },
    }));
  };

  if (loadingClinic || loadingSettings) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie as configurações da sua clínica</p>
      </div>

      <Tabs defaultValue="clinic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="clinic">Clínica</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        {/* CLÍNICA */}
        <TabsContent value="clinic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Dados da Clínica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Nome da Clínica</Label><Input value={clinicForm.name} onChange={(e) => setClinicForm((p) => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>Área de Atuação</Label><Input value={clinicForm.area} onChange={(e) => setClinicForm((p) => ({ ...p, area: e.target.value }))} /></div>
                <div><Label>CNPJ</Label><Input value={clinicForm.cnpj} onChange={(e) => setClinicForm((p) => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" /></div>
                <div><Label>Telefone</Label><Input value={clinicForm.phone} onChange={(e) => setClinicForm((p) => ({ ...p, phone: e.target.value }))} placeholder="(00) 00000-0000" /></div>
              </div>
              <div><Label>Endereço</Label><Input value={clinicForm.address} onChange={(e) => setClinicForm((p) => ({ ...p, address: e.target.value }))} /></div>
              <Button onClick={() => { saveClinicMutation.mutate(); saveSettingsMutation.mutate(); }}>Salvar Dados</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horário de Funcionamento</CardTitle>
              <CardDescription>Configure os horários de atendimento por dia da semana</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DAYS.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3 flex-wrap">
                  <div className="w-24 flex items-center gap-2">
                    <Switch checked={!!businessHours[key]} onCheckedChange={() => toggleDay(key)} />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  {businessHours[key] ? (
                    <div className="flex items-center gap-2">
                      <Input type="time" value={businessHours[key]?.open || "08:00"} onChange={(e) => updateBusinessHour(key, "open", e.target.value)} className="w-28" />
                      <span className="text-muted-foreground">às</span>
                      <Input type="time" value={businessHours[key]?.close || "18:00"} onChange={(e) => updateBusinessHour(key, "close", e.target.value)} className="w-28" />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Fechado</span>
                  )}
                </div>
              ))}
              <Button onClick={() => saveSettingsMutation.mutate()} className="mt-4">Salvar Horários</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WHATSAPP */}
        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Integração WhatsApp
                {connectionStatus === "connected" && <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 ml-2"><Wifi className="h-3 w-3 mr-1" />Conectado</Badge>}
                {connectionStatus === "error" && <Badge variant="destructive" className="ml-2"><WifiOff className="h-3 w-3 mr-1" />Desconectado</Badge>}
              </CardTitle>
              <CardDescription>Conecte sua instância da Evolution API para atendimento via WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>URL da Evolution API</Label><Input value={settingsForm.evolution_api_url} onChange={(e) => setSettingsForm((p) => ({ ...p, evolution_api_url: e.target.value }))} placeholder="https://api.meudominio.com" /></div>
                <div><Label>API Key</Label><Input type="password" value={settingsForm.evolution_api_key} onChange={(e) => setSettingsForm((p) => ({ ...p, evolution_api_key: e.target.value }))} /></div>
              </div>
              <div><Label>Nome da Instância</Label><Input value={settingsForm.evolution_instance} onChange={(e) => setSettingsForm((p) => ({ ...p, evolution_instance: e.target.value }))} placeholder="minha-clinica" /></div>

              <div className="flex gap-2">
                <Button onClick={testConnection} variant="outline" disabled={connectionStatus === "testing"}>
                  {connectionStatus === "testing" ? "Testando..." : "Testar Conexão"}
                </Button>
                <div className="flex items-center gap-2">
                  <Switch checked={settingsForm.whatsapp_enabled} onCheckedChange={(v) => setSettingsForm((p) => ({ ...p, whatsapp_enabled: v }))} />
                  <Label>Ativar atendimento via WhatsApp</Label>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">URL do Webhook</p>
                <p className="text-xs text-muted-foreground">Configure esta URL no painel da Evolution API como webhook de mensagens:</p>
                <div className="flex items-center gap-2">
                  <code className="bg-background text-xs p-2 rounded border flex-1 break-all">{webhookUrl}</code>
                  <Button size="icon" variant="ghost" onClick={copyWebhookUrl}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button onClick={() => saveSettingsMutation.mutate()}>Salvar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CHATBOT */}
        <TabsContent value="chatbot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Chatbot</CardTitle>
              <CardDescription>Personalize o comportamento da assistente virtual Clara</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Mensagem de Boas-Vindas</Label>
                <Textarea value={settingsForm.welcome_message} onChange={(e) => setSettingsForm((p) => ({ ...p, welcome_message: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>Informações Adicionais para o Chatbot</Label>
                <Textarea value={settingsForm.extra_instructions} onChange={(e) => setSettingsForm((p) => ({ ...p, extra_instructions: e.target.value }))} rows={4} placeholder="Ex: Aceitamos planos Unimed e Bradesco Saúde. Estacionamento gratuito..." />
                <p className="text-xs text-muted-foreground mt-1">Essas informações serão incluídas no contexto do chatbot</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={settingsForm.chatbot_site_enabled} onCheckedChange={(v) => setSettingsForm((p) => ({ ...p, chatbot_site_enabled: v }))} />
                  <Label>Ativar chatbot no site</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={settingsForm.chatbot_whatsapp_enabled} onCheckedChange={(v) => setSettingsForm((p) => ({ ...p, chatbot_whatsapp_enabled: v }))} />
                  <Label>Ativar chatbot no WhatsApp</Label>
                </div>
              </div>
              <Button onClick={() => saveSettingsMutation.mutate()}>Salvar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICAÇÕES */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notificações via WhatsApp</CardTitle>
              <CardDescription>Configure lembretes automáticos para pacientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={settingsForm.notify_confirmation_whatsapp} onCheckedChange={(v) => setSettingsForm((p) => ({ ...p, notify_confirmation_whatsapp: v }))} />
                  <Label>Enviar confirmação via WhatsApp após agendamento</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={settingsForm.notify_reminder_24h} onCheckedChange={(v) => setSettingsForm((p) => ({ ...p, notify_reminder_24h: v }))} />
                  <Label>Enviar lembrete 24h antes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={settingsForm.notify_reminder_2h} onCheckedChange={(v) => setSettingsForm((p) => ({ ...p, notify_reminder_2h: v }))} />
                  <Label>Enviar lembrete 2h antes</Label>
                </div>
              </div>
              <div>
                <Label>Template da mensagem de confirmação</Label>
                <Textarea value={settingsForm.confirmation_message_template} onChange={(e) => setSettingsForm((p) => ({ ...p, confirmation_message_template: e.target.value }))} rows={4} />
                <p className="text-xs text-muted-foreground mt-1">
                  Variáveis disponíveis: {"{patient_name}"}, {"{service_name}"}, {"{professional_name}"}, {"{date}"}, {"{time}"}, {"{clinic_name}"}
                </p>
              </div>

              {settingsForm.confirmation_message_template && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <p className="text-sm">
                    {settingsForm.confirmation_message_template
                      .replace("{patient_name}", "João Silva")
                      .replace("{service_name}", "Consulta Geral")
                      .replace("{professional_name}", "Dr. Maria Santos")
                      .replace("{date}", "15/04/2026")
                      .replace("{time}", "14:30")
                      .replace("{clinic_name}", clinicForm.name || "Minha Clínica")}
                  </p>
                </div>
              )}

              <Button onClick={() => saveSettingsMutation.mutate()}>Salvar Notificações</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
