import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">FluxAI</h1>
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button>Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6 text-foreground">
          Seu Funcionário AI para Clínicas
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Automatize agendamentos via WhatsApp, gerencie sua equipe e deixe a IA cuidar dos seus pacientes 24/7
        </p>
        <Link to="/register">
          <Button size="lg" className="text-lg px-8">
            Testar Gratuitamente
          </Button>
        </Link>
      </section>

      <section className="container mx-auto px-4 py-20 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-card p-6 rounded-lg border border-border">
          <Calendar className="w-12 h-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-card-foreground">Agendamento Automático</h3>
          <p className="text-muted-foreground">IA agenda consultas direto pelo WhatsApp em tempo real</p>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <MessageSquare className="w-12 h-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-card-foreground">Chatbot Personalizável</h3>
          <p className="text-muted-foreground">Treine a IA com a linguagem da sua clínica</p>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <Users className="w-12 h-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-card-foreground">Gestão de Equipe</h3>
          <p className="text-muted-foreground">Controle profissionais, horários e disponibilidade</p>
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <BarChart3 className="w-12 h-12 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-card-foreground">Relatórios Inteligentes</h3>
          <p className="text-muted-foreground">Métricas e insights para sua clínica crescer</p>
        </div>
      </section>

      <section className="bg-card border-t border-border py-20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4 text-card-foreground">Planos Simples e Transparentes</h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
            <div className="bg-background p-8 rounded-lg border border-border">
              <h4 className="text-2xl font-bold mb-2 text-foreground">Simples</h4>
              <p className="text-4xl font-bold text-primary mb-4">R$ 389,90<span className="text-lg text-muted-foreground">/mês</span></p>
              <ul className="text-left space-y-2 mb-6 text-muted-foreground">
                <li>✓ 1 número WhatsApp</li>
                <li>✓ Agendamento automático</li>
                <li>✓ Dashboard completo</li>
                <li>✓ Suporte por email</li>
              </ul>
              <Button className="w-full">Começar</Button>
            </div>
            <div className="bg-primary text-primary-foreground p-8 rounded-lg border-2 border-primary">
              <h4 className="text-2xl font-bold mb-2">Premium</h4>
              <p className="text-4xl font-bold mb-4">R$ 649,90<span className="text-lg opacity-80">/mês</span></p>
              <ul className="text-left space-y-2 mb-6">
                <li>✓ Até 2 números WhatsApp</li>
                <li>✓ Agendamento automático</li>
                <li>✓ Dashboard completo</li>
                <li>✓ Suporte prioritário</li>
              </ul>
              <Button variant="secondary" className="w-full">Começar</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
