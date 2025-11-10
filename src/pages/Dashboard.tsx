import { Card } from "@/components/ui/card";
import { Calendar, Users, Activity, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const mockAppointments = [
    { id: 1, patient: "João Silva", service: "Consulta", time: "09:00", professional: "Dr. Carlos" },
    { id: 2, patient: "Maria Santos", service: "Exame", time: "10:30", professional: "Dra. Ana" },
    { id: 3, patient: "Pedro Costa", service: "Retorno", time: "14:00", professional: "Dr. Carlos" },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agendamentos Hoje</p>
                <p className="text-3xl font-bold text-card-foreground">12</p>
              </div>
              <Calendar className="w-10 h-10 text-primary" />
            </div>
          </Card>
          
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Pacientes</p>
                <p className="text-3xl font-bold text-card-foreground">248</p>
              </div>
              <Users className="w-10 h-10 text-primary" />
            </div>
          </Card>
          
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
                <p className="text-3xl font-bold text-card-foreground">87%</p>
              </div>
              <Activity className="w-10 h-10 text-accent" />
            </div>
          </Card>
          
          <Card className="p-6 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Crescimento Mensal</p>
                <p className="text-3xl font-bold text-card-foreground">+23%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-accent" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 border-border">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">Próximos Agendamentos</h2>
            <div className="space-y-4">
              {mockAppointments.map((apt) => (
                <div key={apt.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{apt.patient}</p>
                    <p className="text-sm text-muted-foreground">{apt.service} - {apt.professional}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">{apt.time}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-border">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">Calendário</h2>
            <div className="bg-muted rounded-lg p-8 text-center">
              <p className="text-muted-foreground">Visualização do calendário será implementada aqui</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
