import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Users, Activity, TrendingUp, DollarSign, XCircle, Clock } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

// Dados mock de profissionais
const mockProfessionals = [
  { id: "1", full_name: "Dr. Carlos Silva", specialty: "Clínico Geral", color: "hsl(217, 91%, 53%)" },
  { id: "2", full_name: "Dra. Ana Santos", specialty: "Dermatologia", color: "hsl(160, 84%, 39%)" },
  { id: "3", full_name: "Dr. Pedro Costa", specialty: "Cardiologia", color: "hsl(43, 96%, 56%)" },
];

// Dados mock de serviços
const mockServices = [
  { id: "1", name: "Consulta Geral", duration_minutes: 30, price: 150 },
  { id: "2", name: "Exame de Pele", duration_minutes: 45, price: 200 },
  { id: "3", name: "Eletrocardiograma", duration_minutes: 60, price: 250 },
  { id: "4", name: "Check-up Completo", duration_minutes: 90, price: 400 },
];

// Dados mock de agendamentos
const today = new Date();
const generateMockAppointments = () => {
  const appointments = [];
  const statuses = ["confirmed", "completed", "pending", "cancelled"];
  
  for (let i = -15; i <= 15; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    const numAppointments = Math.floor(Math.random() * 5) + 1;
    
    for (let j = 0; j < numAppointments; j++) {
      const professional = mockProfessionals[Math.floor(Math.random() * mockProfessionals.length)];
      const service = mockServices[Math.floor(Math.random() * mockServices.length)];
      const hour = 8 + Math.floor(Math.random() * 10);
      const status = i < 0 ? (Math.random() > 0.15 ? "completed" : "cancelled") : statuses[Math.floor(Math.random() * 3)];
      
      const startsAt = new Date(date);
      startsAt.setHours(hour, 0, 0, 0);
      
      const endsAt = new Date(startsAt);
      endsAt.setMinutes(endsAt.getMinutes() + service.duration_minutes);
      
      appointments.push({
        id: `${i}-${j}`,
        patient_name: ["João Silva", "Maria Santos", "Pedro Costa", "Ana Oliveira", "Carlos Ferreira"][Math.floor(Math.random() * 5)],
        patient_phone: "(11) 99999-" + String(Math.floor(Math.random() * 9000) + 1000),
        professional_id: professional.id,
        professional_name: professional.full_name,
        professional_color: professional.color,
        service_id: service.id,
        service_name: service.name,
        service_price: service.price,
        starts_at: startsAt,
        ends_at: endsAt,
        status,
      });
    }
  }
  
  return appointments;
};

const mockAppointments = generateMockAppointments();

// Calcular estatísticas
const todayAppointments = mockAppointments.filter(apt => isSameDay(apt.starts_at, today));
const totalPatients = new Set(mockAppointments.map(apt => apt.patient_name)).size;
const completedAppointments = mockAppointments.filter(apt => apt.status === "completed").length;
const cancelledAppointments = mockAppointments.filter(apt => apt.status === "cancelled").length;
const occupancyRate = Math.round((completedAppointments / (completedAppointments + cancelledAppointments)) * 100);
const monthlyRevenue = mockAppointments
  .filter(apt => apt.status === "completed")
  .reduce((acc, apt) => acc + apt.service_price, 0);

// Dados para gráficos
const appointmentsByDay = (() => {
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayAppointments = mockAppointments.filter(apt => isSameDay(apt.starts_at, date));
    last7Days.push({
      day: format(date, "EEE", { locale: ptBR }),
      agendamentos: dayAppointments.length,
      concluidos: dayAppointments.filter(apt => apt.status === "completed").length,
    });
  }
  return last7Days;
})();

const serviceDistribution = mockServices.map(service => ({
  name: service.name,
  value: mockAppointments.filter(apt => apt.service_id === service.id).length,
}));

const professionalPerformance = mockProfessionals.map(prof => ({
  name: prof.full_name.split(" ").slice(0, 2).join(" "),
  atendimentos: mockAppointments.filter(apt => apt.professional_id === prof.id && apt.status === "completed").length,
}));

const revenueByWeek = (() => {
  const weeks = [];
  for (let i = 3; i >= 0; i--) {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - (i * 7));
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    
    const weekRevenue = mockAppointments
      .filter(apt => apt.starts_at >= weekStart && apt.starts_at <= weekEnd && apt.status === "completed")
      .reduce((acc, apt) => acc + apt.service_price, 0);
    
    weeks.push({
      week: `Sem ${4 - i}`,
      receita: weekRevenue,
    });
  }
  return weeks;
})();

const CHART_COLORS = [
  "hsl(217, 91%, 53%)",
  "hsl(160, 84%, 39%)",
  "hsl(43, 96%, 56%)",
  "hsl(280, 65%, 60%)",
  "hsl(340, 75%, 55%)",
];

const Dashboard = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<typeof mockAppointments[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const getAppointmentsForDay = (date: Date) => {
    return mockAppointments.filter(apt => isSameDay(apt.starts_at, date));
  };

  const handleAppointmentClick = (appointment: typeof mockAppointments[0]) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "outline" },
      confirmed: { label: "Confirmado", variant: "default" },
      completed: { label: "Concluído", variant: "secondary" },
      cancelled: { label: "Cancelado", variant: "destructive" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral da sua clínica</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Hoje</p>
            <p className="text-lg font-semibold text-foreground">
              {format(today, "d 'de' MMMM, yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Agendamentos Hoje</p>
                  <p className="text-3xl font-bold text-foreground">{todayAppointments.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Pacientes</p>
                  <p className="text-3xl font-bold text-foreground">{totalPatients}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taxa de Ocupação</p>
                  <p className="text-3xl font-bold text-foreground">{occupancyRate}%</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cancelamentos</p>
                  <p className="text-3xl font-bold text-foreground">{cancelledAppointments}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receita Estimada</p>
                  <p className="text-2xl font-bold text-foreground">
                    R$ {monthlyRevenue.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointments Chart */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Agendamentos por Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appointmentsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="agendamentos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="concluidos" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm text-muted-foreground">Agendados</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <span className="text-sm text-muted-foreground">Concluídos</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-accent" />
                Receita Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueByWeek}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Receita"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="receita"
                      stroke="hsl(var(--accent))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Services Distribution */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Serviços Mais Realizados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {serviceDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {serviceDistribution.map((service, index) => (
                  <div key={service.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-muted-foreground truncate">{service.name}</span>
                    </div>
                    <span className="font-medium">{service.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Professional Performance */}
          <Card className="border-border shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Profissionais Mais Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={professionalPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="atendimentos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Calendário de Agendamentos
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-32 text-center">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4">
              {mockProfessionals.map(prof => (
                <div key={prof.id} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: prof.color }}
                  />
                  <span className="text-sm text-muted-foreground">{prof.full_name}</span>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                <div
                  key={day}
                  className="h-10 flex items-center justify-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
              
              {/* Empty cells for days before month start */}
              {Array.from({ length: startDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="h-24 bg-muted/30 rounded-lg" />
              ))}
              
              {/* Days of the month */}
              {daysInMonth.map(date => {
                const dayAppointments = getAppointmentsForDay(date);
                const isToday = isSameDay(date, today);
                
                return (
                  <div
                    key={date.toISOString()}
                    className={`h-24 p-1 rounded-lg border transition-colors ${
                      isToday
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {format(date, "d")}
                    </div>
                    <div className="space-y-0.5 overflow-y-auto max-h-16">
                      {dayAppointments.slice(0, 3).map(apt => (
                        <div
                          key={apt.id}
                          onClick={() => handleAppointmentClick(apt)}
                          className="text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: apt.professional_color,
                            color: "white",
                          }}
                          title={`${apt.patient_name} - ${apt.service_name}`}
                        >
                          {format(apt.starts_at, "HH:mm")} {apt.patient_name.split(" ")[0]}
                        </div>
                      ))}
                      {dayAppointments.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayAppointments.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Agendamentos de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum agendamento para hoje
              </p>
            ) : (
              <div className="space-y-3">
                {todayAppointments
                  .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())
                  .map(apt => (
                    <div
                      key={apt.id}
                      onClick={() => handleAppointmentClick(apt)}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-1 h-12 rounded-full"
                          style={{ backgroundColor: apt.professional_color }}
                        />
                        <div>
                          <p className="font-medium text-foreground">{apt.patient_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {apt.service_name} • {apt.professional_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          {format(apt.starts_at, "HH:mm")} - {format(apt.ends_at, "HH:mm")}
                        </p>
                        {getStatusBadge(apt.status)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Appointment Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-12 rounded-full"
                  style={{ backgroundColor: selectedAppointment.professional_color }}
                />
                <div>
                  <p className="font-semibold text-lg">{selectedAppointment.patient_name}</p>
                  <p className="text-muted-foreground">{selectedAppointment.patient_phone}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Serviço</p>
                  <p className="font-medium">{selectedAppointment.service_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profissional</p>
                  <p className="font-medium">{selectedAppointment.professional_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {format(selectedAppointment.starts_at, "d 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horário</p>
                  <p className="font-medium">
                    {format(selectedAppointment.starts_at, "HH:mm")} - {format(selectedAppointment.ends_at, "HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-medium text-accent">
                    R$ {selectedAppointment.service_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedAppointment.status)}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
