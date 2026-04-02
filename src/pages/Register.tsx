import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Lock, User, Building2, Phone, ArrowLeft, ArrowRight, Check } from "lucide-react";
import fluxiaLogo from "@/assets/fluxia-logo.png";

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

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            phone: phone || null,
            clinic_name: clinicName,
            clinic_area: area,
            clinic_cnpj: cnpj || null,
          },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário");

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

  const steps = [
    { number: 1, label: "Seus dados" },
    { number: 2, label: "Sua clínica" },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-primary">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary-foreground/5" />
          <div className="absolute bottom-10 -right-16 w-80 h-80 rounded-full bg-primary-foreground/5" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-primary-foreground/[0.03]" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-16">
          <div className="space-y-8 text-center">
            <div className="w-[300px] h-[300px] mx-auto flex items-center justify-center">
              <img src={fluxiaLogo} alt="FluxIA" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <p className="text-primary-foreground/70 text-lg max-w-xs mx-auto leading-relaxed">
              Crie sua conta e comece a transformar sua clínica
            </p>

            <div className="pt-8 space-y-4 text-left max-w-xs mx-auto">
              {[
                "Setup em menos de 5 minutos",
                "Sem cartão de crédito para começar",
                "Suporte dedicado para onboarding",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-primary-foreground/80">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-sm font-semibold">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <img src={fluxiaLogo} alt="FluxIA" className="w-10 h-10 object-contain" />
            </div>
            <span className="text-xl font-bold text-foreground">FluxIA</span>
          </div>

          {/* Step indicator */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-3">
              {steps.map((s, i) => (
                <div key={s.number} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      step >= s.number
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s.number ? <Check className="w-4 h-4" /> : s.number}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      step >= s.number ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                  {i < steps.length - 1 && (
                    <div className="w-8 h-px bg-border mx-1" />
                  )}
                </div>
              ))}
            </div>
            <Progress value={step * 50} className="h-1" />
          </div>

          <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {step === 1 ? "Dados pessoais" : "Dados da clínica"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {step === 1
                ? "Informações sobre você como administrador"
                : "Configure sua clínica para começar"}
            </p>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Nome completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Mín. 6 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Confirmar
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Repita"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleNext} className="w-full h-11 font-medium mt-2">
                <span className="flex items-center gap-2">
                  Próximo <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Nome da clínica
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome da sua clínica"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Área de atuação
                </Label>
                <Select value={area} onValueChange={setArea}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    CNPJ <span className="normal-case text-muted-foreground/60">(opcional)</span>
                  </Label>
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Telefone <span className="normal-case text-muted-foreground/60">(opcional)</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button type="submit" className="flex-1 h-11 font-medium" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Criando...
                    </span>
                  ) : (
                    "Criar conta"
                  )}
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-8">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
