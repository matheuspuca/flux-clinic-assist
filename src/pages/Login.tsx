import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Branding */}
      <div className="lg:w-1/2 bg-primary flex flex-col items-center justify-center p-8 lg:p-16 text-primary-foreground">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 mx-auto bg-primary-foreground/20 rounded-2xl flex items-center justify-center">
            <span className="text-3xl font-bold">FC</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Flux Clinic</h1>
          <p className="text-lg text-primary-foreground/80">Gestão inteligente para sua clínica</p>
        </div>
      </div>

      {/* Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-16 bg-background">
        <Card className="w-full max-w-md border-0 shadow-none bg-transparent">
          <CardContent className="p-0 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {resetMode ? "Recuperar senha" : "Entrar"}
              </h2>
              <p className="text-muted-foreground mt-1">
                {resetMode
                  ? "Digite seu email para receber o link de recuperação"
                  : "Acesse sua conta para gerenciar sua clínica"}
              </p>
            </div>

            <form onSubmit={resetMode ? handleResetPassword : handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {!resetMode && (
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Aguarde..."
                  : resetMode
                  ? "Enviar link de recuperação"
                  : "Entrar"}
              </Button>
            </form>

            <div className="flex flex-col items-center gap-2 text-sm">
              <button
                onClick={() => setResetMode(!resetMode)}
                className="text-primary hover:underline"
              >
                {resetMode ? "Voltar ao login" : "Esqueci minha senha"}
              </button>
              {!resetMode && (
                <p className="text-muted-foreground">
                  Não tem conta?{" "}
                  <Link to="/register" className="text-primary hover:underline font-medium">
                    Criar conta
                  </Link>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
