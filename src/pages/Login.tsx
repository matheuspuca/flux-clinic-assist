import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import fluxiaLogo from "@/assets/fluxia-logo.png";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Erro ao fazer login", { description: error.message });
    } else {
      navigate("/dashboard");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Digite seu email para recuperar a senha");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar email", { description: error.message });
    } else {
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setResetMode(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-primary">
        {/* Decorative shapes */}
        <div className="absolute inset-0">
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary-foreground/5" />
          <div className="absolute bottom-10 -right-16 w-80 h-80 rounded-full bg-primary-foreground/5" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-primary-foreground/[0.03]" />
          <div className="absolute top-20 right-20 w-2 h-2 rounded-full bg-primary-foreground/30" />
          <div className="absolute bottom-40 left-20 w-3 h-3 rounded-full bg-primary-foreground/20" />
          <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full bg-primary-foreground/25" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-16">
          <div className="space-y-8 text-center">
            <div className="w-[300px] h-[300px] mx-auto flex items-center justify-center">
              <img src={fluxiaLogo} alt="FluxIA" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <p className="text-primary-foreground/70 text-lg max-w-xs mx-auto leading-relaxed">
              Gestão inteligente para clínicas modernas
            </p>

            {/* Feature highlights */}
            <div className="pt-8 space-y-4 text-left max-w-xs mx-auto">
              {[
                "Agendamentos automatizados com IA",
                "Chatbot integrado via WhatsApp",
                "Dashboard financeiro em tempo real",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-primary-foreground/80">
                  <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
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

          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {resetMode ? "Recuperar senha" : "Bem-vindo de volta"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {resetMode
                ? "Digite seu email para receber o link de recuperação"
                : "Entre na sua conta para continuar"}
            </p>
          </div>

          <form onSubmit={resetMode ? handleResetPassword : handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            {!resetMode && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Senha
                  </Label>
                  <button
                    type="button"
                    onClick={() => setResetMode(true)}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Aguarde...
                </span>
              ) : resetMode ? (
                "Enviar link de recuperação"
              ) : (
                <span className="flex items-center gap-2">
                  Entrar <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center space-y-3">
            {resetMode && (
              <button
                onClick={() => setResetMode(false)}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                ← Voltar ao login
              </button>
            )}
            {!resetMode && (
              <p className="text-sm text-muted-foreground">
                Não tem conta?{" "}
                <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Criar conta
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
