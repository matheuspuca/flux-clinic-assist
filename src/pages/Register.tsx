import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Lock, User, Building2, Phone, ArrowLeft, ArrowRight } from "lucide-react";

const AREAS = [
  "Odontologia",
  "Fisioterapia",
  "Psicologia",
  "Cardiologia",
  "Clínica Geral",
  "Dermatologia",
  "Nutrição",
  "Outra",
];

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2
  const [clinicName, setClinicName] = useState("");
  const [area, setArea] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");

  const handleNext = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName || !area) {
      toast.error("Preencha o nome da clínica e a área");
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário");

      const userId = authData.user.id;

      // 2. Create clinic
      const { data: clinicData, error: clinicError } = await supabase
        .from("clinics")
        .insert({ name: clinicName, area, cnpj: cnpj || null })
        .select("id")
        .single();
      if (clinicError) throw clinicError;

      // 3. Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        full_name: fullName,
        clinic_id: clinicData.id,
        phone: phone || null,
      });
      if (profileError) throw profileError;

      // 4. Assign admin role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: "admin",
      });
      if (roleError) throw roleError;

      toast.success("Conta criada com sucesso!", {
        description: "Verifique seu email para confirmar o cadastro.",
      });
      navigate("/login");
    } catch (error: any) {
      toast.error("Erro ao criar conta", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Branding */}
      <div className="lg:w-1/2 bg-primary flex flex-col items-center justify-center p-8 lg:p-16 text-primary-foreground">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 mx-auto bg-primary-foreground/20 rounded-2xl flex items-center justify-center">
            <span className="text-3xl font-bold">FC</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Flux Clinic</h1>
          <p className="text-lg text-primary-foreground/80">Crie sua conta e comece a gerenciar sua clínica</p>
        </div>
      </div>

      {/* Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-16 bg-background">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
          <CardContent className="p-0 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Criar conta</h2>
              <p className="text-muted-foreground mt-1">
                Etapa {step} de 2 — {step === 1 ? "Dados pessoais" : "Dados da clínica"}
              </p>
              <Progress value={step * 50} className="mt-3 h-2" />
            </div>

            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Seu nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="password" placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <Button onClick={handleNext} className="w-full">
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
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
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Criando..." : "Criar conta"}
                  </Button>
                </div>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">Entrar</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
