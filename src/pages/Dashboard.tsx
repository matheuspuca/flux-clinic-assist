import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Users, Activity, TrendingUp, DollarSign, XCircle, Clock, Target, Zap, BarChart3, PieChartIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format, isSameDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SmartKPI } from "@/components/dashboard/SmartKPI";
import { BIChart } from "@/components/dashboard/BIChart";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllAppointments, useProfessionals, useServices } from "@/hooks/useClinicData";
import ClinicCalendar from "@/components/calendar/ClinicCalendar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Legend, Line,
} from "recharts";

const CHART_COLORS = [
  "hsl(220, 70%, 50%)", "hsl(160, 60%, 42%)", "hsl(38, 92%, 50%)",
  "hsl(280, 55%, 55%)", "hsl(340, 65%, 50%)",
];

const Dashboard = () => {

  const { data: appointments = [], isLoading: loadingAppts } = useAllAppointments();
  const { data: professionals = [] } = useProfessionals();
  const { data: services = [] } = useServices();

  const today = new Date();

  const metrics = useMemo(() => {
    const todayAppts = appointments.filter(a => isSameDay(new Date(a.starts_at), today));
    const yesterdayAppts = appointments.filter(a => isSameDay(new Date(a.starts_at), subDays(today, 1)));

    const thisWeekAppts = appointments.filter(a => {
      const diff = (today.getTime() - new Date(a.starts_at).getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff < 7;
    });
    const lastWeekAppts = appointments.filter(a => {
      const diff = (today.getTime() - new Date(a.starts_at).getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 7 && diff < 14;
    });

    const completed = appointments.filter(a => a.status === "completed");
    const cancelled = appointments.filter(a => a.status === "cancelled");
    const totalPatients = new Set(appointments.map(a => a.patient_name)).size;

    const getPrice = (a: any) => Number((a as any).services?.price || 0);

    const thisWeekRevenue = thisWeekAppts.filter(a => a.status === "completed").reduce((acc, a) => acc + getPrice(a), 0);
    const lastWeekRevenue = lastWeekAppts.filter(a => a.status === "completed").reduce((acc, a) => acc + getPrice(a), 0);

    const occupancyRate = (completed.length + cancelled.length) > 0 ? Math.round((completed.length / (completed.length + cancelled.length)) * 100) : 0;
    const cancellationRate = appointments.length > 0 ? Math.round((cancelled.length / appointments.length) * 100) : 0;
    const revenueChange = lastWeekRevenue > 0 ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100) : 0;
    const appointmentChange = yesterdayAppts.length > 0 ? Math.round(((todayAppts.length - yesterdayAppts.length) / yesterdayAppts.length) * 100) : 0;
    const avgTicket = completed.length > 0 ? Math.round(completed.reduce((acc, a) => acc + getPrice(a), 0) / completed.length) : 0;

    const hourCounts: Record<number, number> = {};
    completed.forEach(a => { const h = new Date(a.starts_at).getHours(); hourCounts[h] = (hourCounts[h] || 0) + 1; });
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
  }, [appointments]);

  const appointmentsByDay = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const date = subDays(today, i);
      const dayAppts = appointments.filter(a => isSameDay(new Date(a.starts_at), date));
      days.push({
        day: format(date, "dd/MM"),
        agendados: dayAppts.length,
        concluidos: dayAppts.filter(a => a.status === "completed").length,
        cancelados: dayAppts.filter(a => a.status === "cancelled").length,
      });
    }
    return days;
  }, [appointments]);

  const revenueByDay = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const date = subDays(today, i);
      const dayRevenue = appointments
        .filter(a => isSameDay(new Date(a.starts_at), date) && a.status === "completed")
        .reduce((acc, a) => acc + Number((a as any).services?.price || 0), 0);
      days.push({ day: format(date, "dd/MM"), receita: dayRevenue });
    }
    return days;
  }, [appointments]);

  const serviceDistribution = useMemo(() => {
    return services.map(s => ({
      name: s.name,
      value: appointments.filter(a => a.service_id === s.id && a.status === "completed").length,
      revenue: appointments.filter(a => a.service_id === s.id && a.status === "completed").reduce((acc, a) => acc + Number((a as any).services?.price || 0), 0),
    })).filter(s => s.value > 0);
  }, [appointments, services]);

  const professionalPerformance = useMemo(() => {
    return professionals.map((p, i) => {
      const profAppts = appointments.filter(a => a.professional_id === p.id && a.status === "completed");
      return {
        name: p.full_name.split(" ").slice(0, 2).join(" "),
        atendimentos: profAppts.length,
        receita: profAppts.reduce((acc, a) => acc + Number((a as any).services?.price || 0), 0),
        fill: CHART_COLORS[i % CHART_COLORS.length],
      };
    });
  }, [appointments, professionals]);

  const hourlyDistribution = useMemo(() => {
    const hours: Record<number, number> = {};
    for (let h = 8; h <= 18; h++) hours[h] = 0;
    appointments.filter(a => a.status === "completed").forEach(a => {
      const h = new Date(a.starts_at).getHours();
      if (hours[h] !== undefined) hours[h]++;
    });
    return Object.entries(hours).map(([h, count]) => ({ hour: `${h}h`, atendimentos: count }));
  }, [appointments]);

  const todayAppointments = useMemo(() =>
    appointments.filter(a => isSameDay(new Date(a.starts_at), today))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [appointments]
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const getAppointmentsForDay = (date: Date) => appointments.filter(a => isSameDay(new Date(a.starts_at), date));

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

  if (loadingAppts) {
    return (
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-72" /><Skeleton className="h-72" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Visão executiva da sua clínica</p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground">Hoje</p>
              <p className="text-xs sm:text-sm font-medium text-foreground">{format(today, "d 'de' MMMM", { locale: ptBR })}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
          <SmartKPI title="Agendamentos Hoje" value={metrics.todayCount} change={metrics.appointmentChange} changeLabel="vs ontem" icon={Calendar} trend={metrics.appointmentChange > 0 ? "up" : metrics.appointmentChange < 0 ? "down" : "neutral"} insight={`${metrics.confirmedToday} confirmados, ${metrics.pendingToday} pendentes`} />
          <SmartKPI title="Receita Semanal" value={metrics.weeklyRevenue} change={metrics.revenueChange} changeLabel="vs semana anterior" icon={DollarSign} trend={metrics.revenueChange > 0 ? "up" : metrics.revenueChange < 0 ? "down" : "neutral"} format="currency" insight={`Ticket médio: R$ ${metrics.avgTicket}`} />
          <SmartKPI title="Taxa de Ocupação" value={metrics.occupancyRate} icon={Target} trend={metrics.occupancyRate >= 80 ? "up" : metrics.occupancyRate >= 60 ? "neutral" : "down"} format="percent" insight={metrics.occupancyRate >= 80 ? "Excelente desempenho!" : "Oportunidade de otimização"} />
          <SmartKPI title="Total Pacientes" value={metrics.totalPatients} icon={Users} trend="up" insight="Base ativa de clientes" />
          <SmartKPI title="Cancelamentos" value={metrics.cancelled} change={-metrics.cancellationRate} changeLabel="taxa de cancelamento" icon={XCircle} trend={metrics.cancellationRate > 15 ? "down" : "up"} insight={metrics.cancellationRate > 15 ? "Atenção: taxa elevada" : "Dentro do esperado"} />
          <SmartKPI title="Horário de Pico" value={metrics.peakHour} icon={Zap} trend="neutral" insight="Maior concentração de atendimentos" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <BIChart title="Tendência de Agendamentos" subtitle="Últimos 14 dias" icon={BarChart3}>
            <div className="h-56 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={appointmentsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Legend />
                  <Bar dataKey="agendados" name="Agendados" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="concluidos" name="Concluídos" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="cancelados" name="Cancelados" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </BIChart>

          <BIChart title="Evolução de Receita" subtitle="Últimos 14 dias" icon={TrendingUp}>
            <div className="h-56 md:h-72">
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
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Receita"]} />
                  <Area type="monotone" dataKey="receita" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </BIChart>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <BIChart title="Serviços Mais Realizados" icon={PieChartIcon}>
            <div className="h-44 md:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={serviceDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {serviceDistribution.map((_, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {serviceDistribution.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-muted-foreground truncate text-xs">{s.name}</span>
                  </div>
                  <span className="font-medium text-xs">{s.value}</span>
                </div>
              ))}
            </div>
          </BIChart>

          <BIChart title="Desempenho por Profissional" icon={Users}>
            <div className="h-44 md:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={professionalPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={90} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="atendimentos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 pt-3 border-t border-border space-y-1">
              {professionalPerformance.map((p) => (
                <div key={p.name} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{p.name}</span>
                  <span className="font-medium text-accent">R$ {p.receita.toLocaleString("pt-BR")}</span>
                </div>
              ))}
            </div>
          </BIChart>

          <BIChart title="Distribuição por Horário" icon={Clock}>
            <div className="h-44 md:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
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
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-3 md:pb-4 px-3 md:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                <span className="hidden sm:inline">Calendário de Agendamentos</span>
                <span className="sm:hidden">Calendário</span>
              </CardTitle>
              <div className="flex items-center gap-1 md:gap-2">
                <Button variant="outline" size="icon" className="h-7 w-7 md:h-8 md:w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-3.5 w-3.5" /></Button>
                <span className="text-xs md:text-sm font-medium min-w-20 md:min-w-28 text-center capitalize">{format(currentMonth, "MMM yyyy", { locale: ptBR })}</span>
                <Button variant="outline" size="icon" className="h-7 w-7 md:h-8 md:w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 md:px-6 pb-3 md:pb-6">
            <div className="grid grid-cols-7 gap-0.5 md:gap-1">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
                <div key={`${day}-${i}`} className="h-6 md:h-8 flex items-center justify-center text-[10px] md:text-xs font-medium text-muted-foreground">
                  <span className="sm:hidden">{day}</span>
                  <span className="hidden sm:inline">{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][i]}</span>
                </div>
              ))}
              {Array.from({ length: startDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="h-12 md:h-20 bg-muted/30 rounded-md md:rounded-lg" />
              ))}
              {daysInMonth.map(date => {
                const dayAppointments = getAppointmentsForDay(date);
                const isToday = isSameDay(date, today);
                return (
                  <div key={date.toISOString()} className={`h-12 md:h-20 p-0.5 md:p-1 rounded-md md:rounded-lg border transition-all ${isToday ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50 hover:bg-muted/30"}`}>
                    <div className={`text-[10px] md:text-xs font-medium mb-0.5 md:mb-1 text-center md:text-left ${isToday ? "text-primary" : "text-muted-foreground"}`}>{format(date, "d")}</div>
                    <div className="hidden md:block space-y-0.5 overflow-y-auto max-h-12">
                      {dayAppointments.slice(0, 2).map(apt => (
                        <div key={apt.id} onClick={() => { setSelectedAppointment(apt); setDialogOpen(true); }} className="text-[10px] px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity bg-primary text-primary-foreground">
                          {format(new Date(apt.starts_at), "HH:mm")}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && <div className="text-[10px] text-muted-foreground text-center">+{dayAppointments.length - 2}</div>}
                    </div>
                    {dayAppointments.length > 0 && (
                      <div className="md:hidden flex justify-center gap-0.5">
                        {dayAppointments.slice(0, 3).map(apt => (
                          <div key={apt.id} className="w-1 h-1 rounded-full bg-primary" />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3 md:pb-4 px-3 md:px-6">
            <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
              Agenda de Hoje
              <Badge variant="secondary" className="ml-2 text-xs">{todayAppointments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            {todayAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 md:py-8 text-sm">Nenhum agendamento para hoje</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {todayAppointments.map(apt => (
                  <div key={apt.id} onClick={() => { setSelectedAppointment(apt); setDialogOpen(true); }} className="flex items-center justify-between p-2.5 md:p-3 rounded-lg bg-muted/40 hover:bg-muted/60 cursor-pointer transition-all border border-transparent hover:border-border">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div className="w-1 h-8 md:h-10 rounded-full flex-shrink-0 bg-primary" />
                      <div className="min-w-0">
                        <p className="font-medium text-xs md:text-sm text-foreground truncate">{apt.patient_name}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground truncate">{(apt as any).services?.name || "—"}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-semibold text-xs md:text-sm text-primary">{format(new Date(apt.starts_at), "HH:mm")}</p>
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
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader><DialogTitle>Detalhes do Agendamento</DialogTitle></DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-12 rounded-full bg-primary" />
                <div>
                  <p className="font-semibold text-lg">{selectedAppointment.patient_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.patient_phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Serviço</p><p className="font-medium text-sm">{(selectedAppointment as any).services?.name || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Profissional</p><p className="font-medium text-sm">{(selectedAppointment as any).professionals?.full_name || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Data</p><p className="font-medium text-sm">{format(new Date(selectedAppointment.starts_at), "d 'de' MMMM", { locale: ptBR })}</p></div>
                <div><p className="text-xs text-muted-foreground">Horário</p><p className="font-medium text-sm">{format(new Date(selectedAppointment.starts_at), "HH:mm")} - {format(new Date(selectedAppointment.ends_at), "HH:mm")}</p></div>
                <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-medium text-sm text-accent">R$ {Number((selectedAppointment as any).services?.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p>{getStatusBadge(selectedAppointment.status)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
