import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Calendar, Users, Activity, TrendingUp, DollarSign, XCircle, Clock, 
  Target, Zap, BarChart3, PieChartIcon, ArrowUpRight, ArrowDownRight 
} from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SmartKPI } from "@/components/dashboard/SmartKPI";
import { BIChart } from "@/components/dashboard/BIChart";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  AreaChart,
  Area,
  ComposedChart,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";

// Mock professionals
const mockProfessionals = [
  { id: "1", full_name: "Dr. Carlos Silva", specialty: "Clínico Geral", color: "hsl(220, 70%, 50%)" },
  { id: "2", full_name: "Dra. Ana Santos", specialty: "Dermatologia", color: "hsl(160, 60%, 42%)" },
  { id: "3", full_name: "Dr. Pedro Costa", specialty: "Cardiologia", color: "hsl(38, 92%, 50%)" },
];

// Mock services
const mockServices = [
  { id: "1", name: "Consulta Geral", duration_minutes: 30, price: 150 },
  { id: "2", name: "Exame de Pele", duration_minutes: 45, price: 200 },
  { id: "3", name: "Eletrocardiograma", duration_minutes: 60, price: 250 },
  { id: "4", name: "Check-up Completo", duration_minutes: 90, price: 400 },
];

// Generate mock appointments
const today = new Date();
const generateMockAppointments = () => {
  const appointments = [];
  const statuses = ["confirmed", "completed", "pending", "cancelled"];
  
  for (let i = -30; i <= 15; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    const numAppointments = Math.floor(Math.random() * 6) + 2;
    
    for (let j = 0; j < numAppointments; j++) {
      const professional = mockProfessionals[Math.floor(Math.random() * mockProfessionals.length)];
      const service = mockServices[Math.floor(Math.random() * mockServices.length)];
      const hour = 8 + Math.floor(Math.random() * 10);
      const status = i < 0 ? (Math.random() > 0.12 ? "completed" : "cancelled") : statuses[Math.floor(Math.random() * 3)];
      
      const startsAt = new Date(date);
      startsAt.setHours(hour, 0, 0, 0);
      
      const endsAt = new Date(startsAt);
      endsAt.setMinutes(endsAt.getMinutes() + service.duration_minutes);
      
      appointments.push({
        id: `${i}-${j}`,
        patient_name: ["João Silva", "Maria Santos", "Pedro Costa", "Ana Oliveira", "Carlos Ferreira", "Lucia Mendes", "Roberto Lima"][Math.floor(Math.random() * 7)],
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

// Smart calculations with insights
const calculateMetrics = () => {
  const todayAppts = mockAppointments.filter(apt => isSameDay(apt.starts_at, today));
  const yesterdayAppts = mockAppointments.filter(apt => isSameDay(apt.starts_at, subDays(today, 1)));
  
  const thisWeekAppts = mockAppointments.filter(apt => {
    const diff = (today.getTime() - apt.starts_at.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff < 7;
  });
  
  const lastWeekAppts = mockAppointments.filter(apt => {
    const diff = (today.getTime() - apt.starts_at.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 7 && diff < 14;
  });
  
  const completed = mockAppointments.filter(apt => apt.status === "completed");
  const cancelled = mockAppointments.filter(apt => apt.status === "cancelled");
  const totalPatients = new Set(mockAppointments.map(apt => apt.patient_name)).size;
  
  const thisWeekRevenue = thisWeekAppts.filter(a => a.status === "completed").reduce((acc, a) => acc + a.service_price, 0);
  const lastWeekRevenue = lastWeekAppts.filter(a => a.status === "completed").reduce((acc, a) => acc + a.service_price, 0);
  
  const occupancyRate = Math.round((completed.length / (completed.length + cancelled.length)) * 100);
  const cancellationRate = Math.round((cancelled.length / mockAppointments.length) * 100);
  
  const revenueChange = lastWeekRevenue > 0 ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100) : 0;
  const appointmentChange = yesterdayAppts.length > 0 ? Math.round(((todayAppts.length - yesterdayAppts.length) / yesterdayAppts.length) * 100) : 0;
  
  // Calculate average ticket
  const avgTicket = completed.length > 0 ? Math.round(completed.reduce((acc, a) => acc + a.service_price, 0) / completed.length) : 0;
  
  // Peak hours analysis
  const hourCounts: Record<number, number> = {};
  completed.forEach(apt => {
    const hour = apt.starts_at.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "10";
  
  return {
    todayCount: todayAppts.length,
    totalPatients,
    occupancyRate,
    cancellationRate,
    cancelled: cancelled.length,
    weeklyRevenue: thisWeekRevenue,
    revenueChange,
    appointmentChange,
    avgTicket,
    peakHour: `${peakHour}h`,
    confirmedToday: todayAppts.filter(a => a.status === "confirmed").length,
    pendingToday: todayAppts.filter(a => a.status === "pending").length,
  };
};

const metrics = calculateMetrics();

// Chart data
const appointmentsByDay = (() => {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const date = subDays(today, i);
    const dayAppts = mockAppointments.filter(apt => isSameDay(apt.starts_at, date));
    days.push({
      day: format(date, "dd/MM"),
      agendados: dayAppts.length,
      concluidos: dayAppts.filter(apt => apt.status === "completed").length,
      cancelados: dayAppts.filter(apt => apt.status === "cancelled").length,
    });
  }
  return days;
})();

const revenueByDay = (() => {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const date = subDays(today, i);
    const dayRevenue = mockAppointments
      .filter(apt => isSameDay(apt.starts_at, date) && apt.status === "completed")
      .reduce((acc, apt) => acc + apt.service_price, 0);
    days.push({
      day: format(date, "dd/MM"),
      receita: dayRevenue,
    });
  }
  return days;
})();

const serviceDistribution = mockServices.map(service => ({
  name: service.name,
  value: mockAppointments.filter(apt => apt.service_id === service.id && apt.status === "completed").length,
  revenue: mockAppointments.filter(apt => apt.service_id === service.id && apt.status === "completed").reduce((acc, a) => acc + a.service_price, 0),
}));

const professionalPerformance = mockProfessionals.map(prof => {
  const profAppts = mockAppointments.filter(apt => apt.professional_id === prof.id && apt.status === "completed");
  return {
    name: prof.full_name.split(" ").slice(0, 2).join(" "),
    atendimentos: profAppts.length,
    receita: profAppts.reduce((acc, a) => acc + a.service_price, 0),
    fill: prof.color,
  };
});

const hourlyDistribution = (() => {
  const hours: Record<number, number> = {};
  for (let h = 8; h <= 18; h++) hours[h] = 0;
  
  mockAppointments.filter(a => a.status === "completed").forEach(apt => {
    const hour = apt.starts_at.getHours();
    if (hours[hour] !== undefined) hours[hour]++;
  });
  
  return Object.entries(hours).map(([hour, count]) => ({
    hour: `${hour}h`,
    atendimentos: count,
  }));
})();

const CHART_COLORS = [
  "hsl(220, 70%, 50%)",
  "hsl(160, 60%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 55%, 55%)",
  "hsl(340, 65%, 50%)",
];

const Dashboard = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<typeof mockAppointments[0] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const todayAppointments = useMemo(() => 
    mockAppointments.filter(apt => isSameDay(apt.starts_at, today))
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime()),
    []
  );

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
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Visão executiva da sua clínica</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Hoje</p>
              <p className="text-sm font-medium text-foreground">
                {format(today, "d 'de' MMMM, yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        {/* Smart KPIs Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <SmartKPI
            title="Agendamentos Hoje"
            value={metrics.todayCount}
            change={metrics.appointmentChange}
            changeLabel="vs ontem"
            icon={Calendar}
            trend={metrics.appointmentChange > 0 ? "up" : metrics.appointmentChange < 0 ? "down" : "neutral"}
            insight={`${metrics.confirmedToday} confirmados, ${metrics.pendingToday} pendentes`}
          />
          <SmartKPI
            title="Receita Semanal"
            value={metrics.weeklyRevenue}
            change={metrics.revenueChange}
            changeLabel="vs semana anterior"
            icon={DollarSign}
            trend={metrics.revenueChange > 0 ? "up" : metrics.revenueChange < 0 ? "down" : "neutral"}
            format="currency"
            insight={`Ticket médio: R$ ${metrics.avgTicket}`}
          />
          <SmartKPI
            title="Taxa de Ocupação"
            value={metrics.occupancyRate}
            icon={Target}
            trend={metrics.occupancyRate >= 80 ? "up" : metrics.occupancyRate >= 60 ? "neutral" : "down"}
            format="percent"
            insight={metrics.occupancyRate >= 80 ? "Excelente desempenho!" : "Oportunidade de otimização"}
          />
          <SmartKPI
            title="Total Pacientes"
            value={metrics.totalPatients}
            icon={Users}
            trend="up"
            insight="Base ativa de clientes"
          />
          <SmartKPI
            title="Cancelamentos"
            value={metrics.cancelled}
            change={-metrics.cancellationRate}
            changeLabel="taxa de cancelamento"
            icon={XCircle}
            trend={metrics.cancellationRate > 15 ? "down" : "up"}
            insight={metrics.cancellationRate > 15 ? "Atenção: taxa elevada" : "Dentro do esperado"}
          />
          <SmartKPI
            title="Horário de Pico"
            value={metrics.peakHour}
            icon={Zap}
            trend="neutral"
            insight="Maior concentração de atendimentos"
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointments Trend */}
          <BIChart
            title="Tendência de Agendamentos"
            subtitle="Últimos 14 dias"
            icon={BarChart3}
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={appointmentsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Bar dataKey="agendados" name="Agendados" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="concluidos" name="Concluídos" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="cancelados" name="Cancelados" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </BIChart>

          {/* Revenue Evolution */}
          <BIChart
            title="Evolução de Receita"
            subtitle="Últimos 14 dias"
            icon={TrendingUp}
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueByDay}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Receita"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </BIChart>
        </div>

        {/* Analytics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Service Distribution */}
          <BIChart title="Serviços Mais Realizados" icon={PieChartIcon}>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
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
                    formatter={(value: number, name: string, props: any) => [
                      `${value} atend. | R$ ${props.payload.revenue.toLocaleString("pt-BR")}`,
                      props.payload.name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {serviceDistribution.map((service, index) => (
                <div key={service.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-muted-foreground truncate text-xs">{service.name}</span>
                  </div>
                  <span className="font-medium text-xs">{service.value}</span>
                </div>
              ))}
            </div>
          </BIChart>

          {/* Professional Performance */}
          <BIChart title="Desempenho por Profissional" icon={Users}>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={professionalPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={90} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      name === "atendimentos" ? `${value} atendimentos` : `R$ ${value.toLocaleString("pt-BR")}`,
                      name === "atendimentos" ? "Atendimentos" : "Receita"
                    ]}
                  />
                  <Bar dataKey="atendimentos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 pt-3 border-t border-border space-y-1">
              {professionalPerformance.map((prof) => (
                <div key={prof.name} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{prof.name}</span>
                  <span className="font-medium text-accent">R$ {prof.receita.toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </BIChart>

          {/* Hourly Distribution */}
          <BIChart title="Distribuição por Horário" icon={Clock}>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="atendimentos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Horário de pico: <span className="font-semibold text-primary">{metrics.peakHour}</span>
            </p>
          </BIChart>
        </div>

        {/* Calendar */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Calendário de Agendamentos
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-28 text-center">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
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
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: prof.color }}
                  />
                  <span className="text-xs text-muted-foreground">{prof.full_name}</span>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                <div
                  key={day}
                  className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
              
              {Array.from({ length: startDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="h-20 bg-muted/30 rounded-lg" />
              ))}
              
              {daysInMonth.map(date => {
                const dayAppointments = getAppointmentsForDay(date);
                const isToday = isSameDay(date, today);
                
                return (
                  <div
                    key={date.toISOString()}
                    className={`h-20 p-1 rounded-lg border transition-all ${
                      isToday
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                      {format(date, "d")}
                    </div>
                    <div className="space-y-0.5 overflow-y-auto max-h-12">
                      {dayAppointments.slice(0, 2).map(apt => (
                        <div
                          key={apt.id}
                          onClick={() => handleAppointmentClick(apt)}
                          className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: apt.professional_color,
                            color: "white",
                          }}
                        >
                          {format(apt.starts_at, "HH:mm")}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-[10px] text-muted-foreground text-center">
                          +{dayAppointments.length - 2}
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
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Agenda de Hoje
              <Badge variant="secondary" className="ml-2">{todayAppointments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum agendamento para hoje
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {todayAppointments.map(apt => (
                  <div
                    key={apt.id}
                    onClick={() => handleAppointmentClick(apt)}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 cursor-pointer transition-all border border-transparent hover:border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1 h-10 rounded-full"
                        style={{ backgroundColor: apt.professional_color }}
                      />
                      <div>
                        <p className="font-medium text-sm text-foreground">{apt.patient_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {apt.service_name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-primary">
                        {format(apt.starts_at, "HH:mm")}
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
                  className="w-1.5 h-12 rounded-full"
                  style={{ backgroundColor: selectedAppointment.professional_color }}
                />
                <div>
                  <p className="font-semibold text-lg">{selectedAppointment.patient_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.patient_phone}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Serviço</p>
                  <p className="font-medium text-sm">{selectedAppointment.service_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Profissional</p>
                  <p className="font-medium text-sm">{selectedAppointment.professional_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="font-medium text-sm">
                    {format(selectedAppointment.starts_at, "d 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Horário</p>
                  <p className="font-medium text-sm">
                    {format(selectedAppointment.starts_at, "HH:mm")} - {format(selectedAppointment.ends_at, "HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-medium text-sm text-accent">
                    R$ {selectedAppointment.service_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
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
