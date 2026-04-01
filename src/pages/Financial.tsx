import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, CreditCard, Calendar as CalendarIcon, ArrowUpCircle, ArrowDownCircle, PiggyBank } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { useAllAppointments, useServices } from "@/hooks/useClinicData";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--info))"];

const Financial = () => {
  const { data: appointments = [], isLoading } = useAllAppointments();
  const { data: services = [] } = useServices();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // Derive financial data from completed appointments
  const financialData = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    const monthAppts = appointments.filter(a => {
      const d = new Date(a.starts_at);
      return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });

    const completedAppts = monthAppts.filter(a => a.status === "completed");
    const getPrice = (a: any) => Number(a.services?.price || 0);

    const totalRevenue = completedAppts.reduce((acc, a) => acc + getPrice(a), 0);
    const avgTicket = completedAppts.length > 0 ? totalRevenue / completedAppts.length : 0;
    const totalAppointments = monthAppts.length;
    const completedCount = completedAppts.length;
    const cancelledCount = monthAppts.filter(a => a.status === "cancelled").length;

    // Revenue by day
    const dailyRevenue: Record<string, number> = {};
    completedAppts.forEach(a => {
      const day = format(new Date(a.starts_at), "dd/MM");
      dailyRevenue[day] = (dailyRevenue[day] || 0) + getPrice(a);
    });
    const revenueByDay = Object.entries(dailyRevenue)
      .map(([day, receita]) => ({ day, receita }))
      .sort((a, b) => a.day.localeCompare(b.day));

    // Revenue by service
    const revenueByService = services.map(s => {
      const sAppts = completedAppts.filter(a => a.service_id === s.id);
      return { name: s.name, value: sAppts.reduce((acc, a) => acc + getPrice(a), 0), count: sAppts.length };
    }).filter(s => s.value > 0);

    // Monthly comparison (last 6 months)
    const monthlyComparison = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(new Date(), i);
      const mStart = startOfMonth(m);
      const mEnd = endOfMonth(m);
      const mAppts = appointments.filter(a => {
        const d = new Date(a.starts_at);
        return isWithinInterval(d, { start: mStart, end: mEnd }) && a.status === "completed";
      });
      monthlyComparison.push({
        month: format(m, "MMM", { locale: ptBR }),
        receita: mAppts.reduce((acc, a) => acc + getPrice(a), 0),
      });
    }

    // Previous month comparison
    const prevMonthStart = startOfMonth(subMonths(selectedMonth, 1));
    const prevMonthEnd = endOfMonth(subMonths(selectedMonth, 1));
    const prevMonthRevenue = appointments
      .filter(a => isWithinInterval(new Date(a.starts_at), { start: prevMonthStart, end: prevMonthEnd }) && a.status === "completed")
      .reduce((acc, a) => acc + getPrice(a), 0);
    const revenueChange = prevMonthRevenue > 0 ? Math.round(((totalRevenue - prevMonthRevenue) / prevMonthRevenue) * 100) : 0;

    return { totalRevenue, avgTicket, totalAppointments, completedCount, cancelledCount, revenueByDay, revenueByService, monthlyComparison, revenueChange };
  }, [appointments, services, selectedMonth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gestão financeira baseada nos atendimentos</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <CalendarIcon className="h-4 w-4" />
              <span>{format(selectedMonth, "MMMM yyyy", { locale: ptBR })}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={selectedMonth} onSelect={(d) => d && setSelectedMonth(d)} locale={ptBR} />
          </PopoverContent>
        </Popover>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Receita Total</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{formatCurrency(financialData.totalRevenue)}</p>
            <p className={cn("text-xs mt-1", financialData.revenueChange >= 0 ? "text-accent" : "text-destructive")}>
              {financialData.revenueChange >= 0 ? "+" : ""}{financialData.revenueChange}% vs mês anterior
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Ticket Médio</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{formatCurrency(financialData.avgTicket)}</p>
            <p className="text-xs text-muted-foreground mt-1">{financialData.completedCount} atendimentos</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpCircle className="h-4 w-4 text-accent" />
              <span className="text-xs text-muted-foreground">Atendimentos</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{financialData.totalAppointments}</p>
            <p className="text-xs text-muted-foreground mt-1">{financialData.completedCount} concluídos</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownCircle className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Cancelamentos</span>
            </div>
            <p className="text-xl md:text-2xl font-bold text-foreground">{financialData.cancelledCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {financialData.totalAppointments > 0 ? Math.round((financialData.cancelledCount / financialData.totalAppointments) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm md:text-base">Receita Diária</CardTitle>
            <CardDescription>Faturamento por dia no mês selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialData.revenueByDay}>
                  <defs>
                    <linearGradient id="finRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => [formatCurrency(value), "Receita"]} />
                  <Area type="monotone" dataKey="receita" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#finRevenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-sm md:text-base">Comparativo Mensal</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData.monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => [formatCurrency(value), "Receita"]} />
                  <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Service */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm md:text-base">Receita por Serviço</CardTitle>
          <CardDescription>Faturamento detalhado por tipo de serviço</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-56 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={financialData.revenueByService} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {financialData.revenueByService.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(value: number) => [formatCurrency(value), "Receita"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {financialData.revenueByService.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-sm text-muted-foreground">{s.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(s.value)}</p>
                    <p className="text-xs text-muted-foreground">{s.count} atend.</p>
                  </div>
                </div>
              ))}
              {financialData.revenueByService.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Sem dados para o período</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Financial;
