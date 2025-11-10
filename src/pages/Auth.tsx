import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100),
});

const signupSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }).max(100),
  confirmPassword: z.string(),
  fullName: z.string().trim().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }).max(100),
  clinicName: z.string().trim().min(3, { message: "Nome da clínica deve ter no mínimo 3 caracteres" }).max(150),
  clinicArea: z.string().trim().min(3, { message: "Área deve ter no mínimo 3 caracteres" }).max(100),
  phone: z.string().trim().max(20).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    clinicName: "",
    clinicArea: "",
    phone: "",
  });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    
    try {
      loginSchema.parse(loginData);
      setIsLoading(true);
      
      const { error } = await signIn(loginData.email, loginData.password);
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Erro ao fazer login",
            description: "Email ou senha incorretos",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao fazer login",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Login realizado com sucesso!",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setLoginErrors(errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});
    
    try {
      signupSchema.parse(signupData);
      setIsLoading(true);
      
      const { error } = await signUp(
        signupData.email,
        signupData.password,
        signupData.fullName,
        signupData.clinicName,
        signupData.clinicArea,
        signupData.phone
      );
      
      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Erro ao criar conta",
            description: "Este email já está cadastrado",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao criar conta",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Conta criada com sucesso!",
          description: "Você já pode fazer login",
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setSignupErrors(errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="text-3xl font-bold text-primary mb-2">FluxAI</h1>
          </Link>
          <p className="text-muted-foreground">Seu funcionário AI para clínicas</p>
        </div>

        <Card className="p-6 border-border">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                  {loginErrors.email && (
                    <p className="text-sm text-destructive mt-1">{loginErrors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                  {loginErrors.password && (
                    <p className="text-sm text-destructive mt-1">{loginErrors.password}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    placeholder="João Silva"
                  />
                  {signupErrors.fullName && (
                    <p className="text-sm text-destructive mt-1">{signupErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="signup-clinic">Nome da Clínica</Label>
                  <Input
                    id="signup-clinic"
                    value={signupData.clinicName}
                    onChange={(e) => setSignupData({ ...signupData, clinicName: e.target.value })}
                    placeholder="Clínica Saúde Total"
                  />
                  {signupErrors.clinicName && (
                    <p className="text-sm text-destructive mt-1">{signupErrors.clinicName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="signup-area">Área de Atuação</Label>
                  <Input
                    id="signup-area"
                    value={signupData.clinicArea}
                    onChange={(e) => setSignupData({ ...signupData, clinicArea: e.target.value })}
                    placeholder="Odontologia, Fisioterapia, etc."
                  />
                  {signupErrors.clinicArea && (
                    <p className="text-sm text-destructive mt-1">{signupErrors.clinicArea}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="signup-phone">Telefone (opcional)</Label>
                  <Input
                    id="signup-phone"
                    value={signupData.phone}
                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                    placeholder="(11) 98765-4321"
                  />
                  {signupErrors.phone && (
                    <p className="text-sm text-destructive mt-1">{signupErrors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    placeholder="seu@email.com"
                  />
                  {signupErrors.email && (
                    <p className="text-sm text-destructive mt-1">{signupErrors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                  {signupErrors.password && (
                    <p className="text-sm text-destructive mt-1">{signupErrors.password}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                  {signupErrors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{signupErrors.confirmPassword}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Criando conta..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
