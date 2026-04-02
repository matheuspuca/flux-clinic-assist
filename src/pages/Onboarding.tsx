import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Phone } from "lucide-react";

const AREAS = [
  "Odontologia", "Fisioterapia", "Psicologia", "Cardiologia",
  "Clínica Geral", "Dermatologia", "Nutrição", "Outra",
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [area, setArea] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName || !area || !user) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const { data: clinicData, error: clinicError } = await supabase
        .from("clinics")
        .insert({ name: clinicName, area, cnpj: cnpj || null })
        .select("id")
        .single();
      if (clinicError) throw clinicError;

      // Create profile for the user
      const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário";
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ id: user.id, clinic_id: clinicData.id, full_name: fullName, phone: phone || null });
      if (profileError) throw profileError;

      // Assign admin role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "admin" });
      if (roleError) throw roleError;

      // Create default clinic settings
      await supabase.from("clinic_settings").insert({ clinic_id: clinicData.id });

      toast.success("Clínica configurada com sucesso!");
      navigate("/dashboard");
      window.location.reload();
    } catch (error: any) {
      toast.error("Erro ao configurar clínica", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Configure sua clínica</CardTitle>
          <CardDescription>Preencha os dados para começar a usar o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da clínica</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Nome da sua clínica" value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Área de atuação</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger><SelectValue placeholder="Selecione a área" /></SelectTrigger>
                <SelectContent>
                  {AREAS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>CNPJ <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input placeholder="00.000.000/0000-00" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefone <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Configurando..." : "Começar a usar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
