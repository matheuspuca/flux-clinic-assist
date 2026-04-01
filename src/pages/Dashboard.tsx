import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, DollarSign, XCircle, Target, Zap } from "lucide-react";
import { format, isSameDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SmartKPI } from "@/components/dashboard/SmartKPI";
import { BIChart } from "@/components/dashboard/BIChart";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllAppointments, useProfessionals, useServices } from "@/hooks/useClinicData";
import ClinicCalendar from "@/components/calendar/ClinicCalendar";

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

  // todayAppointments and calendar state removed — now handled by ClinicCalendar

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

        {/* Professional Calendar */}
        <ClinicCalendar />
      </div>
    </div>
  );
};

export default Dashboard;
