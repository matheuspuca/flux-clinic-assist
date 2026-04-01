import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft, ChevronRight, Plus, Clock, Calendar as CalendarIcon,
  Check, X, ArrowRight,
} from "lucide-react";
import {
  format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, addDays, subDays, startOfWeek, endOfWeek,
  isSameMonth, isToday as isDateToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAllAppointments, useProfessionals, useServices, useCreateAppointment, useUpdateAppointment } from "@/hooks/useClinicData";

type CalendarView = "day" | "week" | "month";

const PROF_COLORS = [
  "hsl(220, 70%, 50%)", "hsl(160, 60%, 42%)", "hsl(38, 92%, 50%)",
  "hsl(280, 55%, 55%)", "hsl(340, 65%, 50%)", "hsl(190, 70%, 45%)",
  "hsl(30, 80%, 50%)", "hsl(260, 50%, 60%)",
];

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7h to 20h

const ClinicCalendar = () => {
  const [view, setView] = useState<CalendarView>(() => {
    return (localStorage.getItem("clinic-calendar-view") as CalendarView) || "week";
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [newDialog, setNewDialog] = useState(false);
  const [prefillTime, setPrefillTime] = useState("");

  const { data: appointments = [] } = useAllAppointments();
  const { data: professionals = [] } = useProfessionals();
  const { data: services = [] } = useServices();
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();

  const [formData, setFormData] = useState({
    patient_name: "", patient_phone: "", patient_email: "",
    service_id: "", professional_id: "", date: new Date(), time: "", notes: "",
  });

  useEffect(() => {
    localStorage.setItem("clinic-calendar-view", view);
  }, [view]);

  const profColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    professionals.forEach((p, i) => { map[p.id] = PROF_COLORS[i % PROF_COLORS.length]; });
    return map;
  }, [professionals]);

  const filteredAppointments = useMemo(() => {
    if (!selectedProfessional) return appointments;
    return appointments.filter(a => a.professional_id === selectedProfessional);
  }, [appointments, selectedProfessional]);

  const navigateDate = (dir: number) => {
    if (view === "day") setSelectedDate(d => addDays(d, dir));
    else if (view === "week") setSelectedDate(d => addDays(d, dir * 7));
    else setSelectedDate(d => dir > 0 ? addMonths(d, 1) : subMonths(d, 1));
  };

  const goToday = () => setSelectedDate(new Date());

  const openNewAppointment = (time?: string, date?: Date) => {
    setFormData({
      patient_name: "", patient_phone: "", patient_email: "",
      service_id: "", professional_id: selectedProfessional || "", date: date || selectedDate, time: time || "", notes: "",
    });
    setNewDialog(true);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const svc = services.find(s => s.id === formData.service_id);
    if (!svc) return;
    const [h, m] = formData.time.split(":").map(Number);
    const startsAt = new Date(formData.date);
    startsAt.setHours(h, m, 0, 0);
    const endsAt = new Date(startsAt);
    endsAt.setMinutes(endsAt.getMinutes() + svc.duration_minutes);
    createMutation.mutate({
      patient_name: formData.patient_name,
      patient_phone: formData.patient_phone || undefined,
      patient_email: formData.patient_email || undefined,
      service_id: formData.service_id,
      professional_id: formData.professional_id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      notes: formData.notes || undefined,
    }, { onSuccess: () => setNewDialog(false) });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateMutation.mutate({ id, status });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendente", className: "border-border text-muted-foreground" },
      confirmed: { label: "Confirmado", className: "bg-info text-info-foreground border-transparent" },
      completed: { label: "Concluído", className: "bg-accent text-accent-foreground border-transparent" },
      cancelled: { label: "Cancelado", className: "bg-destructive text-destructive-foreground border-transparent" },
    };
    const c = map[status] || map.pending;
    return <Badge variant="outline" className={`text-[10px] ${c.className}`}>{c.label}</Badge>;
  };

  // ── Day View ──
  const dayAppts = useMemo(() =>
    filteredAppointments.filter(a => isSameDay(new Date(a.starts_at), selectedDate)),
    [filteredAppointments, selectedDate]
  );

  const renderDayView = () => (
    <div className="relative">
      <div className="overflow-y-auto max-h-[60vh]">
        {HOURS.map(hour => (
          <div key={hour} className="flex border-t border-border min-h-[60px]">
            <div className="w-12 md:w-16 flex-shrink-0 text-[10px] md:text-xs text-muted-foreground py-1 text-right pr-2">
              {`${hour.toString().padStart(2, "0")}:00`}
            </div>
            <div className="flex-1 relative">
              {/* :00 slot */}
              <div
                className="h-[30px] border-b border-border/30 hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => openNewAppointment(`${hour.toString().padStart(2, "0")}:00`, selectedDate)}
              />
              {/* :30 slot */}
              <div
                className="h-[30px] hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => openNewAppointment(`${hour.toString().padStart(2, "0")}:30`, selectedDate)}
              />
              {/* Appointment blocks */}
              {dayAppts
                .filter(a => new Date(a.starts_at).getHours() === hour)
                .map(apt => {
                  const start = new Date(apt.starts_at);
                  const end = new Date(apt.ends_at);
                  const topOffset = start.getMinutes();
                  const duration = (end.getTime() - start.getTime()) / 60000;
                  const heightPx = Math.max(duration, 15);
                  return (
                    <div
                      key={apt.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); setDetailDialog(true); }}
                      className="absolute left-1 right-1 rounded-md px-2 py-0.5 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden z-10 border border-background/20"
                      style={{
                        top: `${topOffset}px`,
                        height: `${heightPx}px`,
                        backgroundColor: profColorMap[apt.professional_id] || "hsl(var(--primary))",
                        color: "white",
                      }}
                    >
                      <p className="text-[10px] md:text-xs font-semibold truncate">
                        {format(start, "HH:mm")} {apt.patient_name}
                      </p>
                      {heightPx > 20 && (
                        <p className="text-[9px] md:text-[10px] opacity-80 truncate">
                          {(apt as any).services?.name}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Week View ──
  const weekStart = startOfWeek(selectedDate, { locale: ptBR });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const renderWeekView = () => (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Header */}
        <div className="flex border-b border-border sticky top-0 bg-card z-20">
          <div className="w-12 md:w-16 flex-shrink-0" />
          {weekDays.map(day => (
            <div
              key={day.toISOString()}
              onClick={() => { setSelectedDate(day); setView("day"); }}
              className={`flex-1 text-center py-2 cursor-pointer transition-colors ${
                isDateToday(day) ? "bg-primary/10" : "hover:bg-muted/50"
              }`}
            >
              <p className="text-[10px] md:text-xs text-muted-foreground">
                {format(day, "EEE", { locale: ptBR })}
              </p>
              <p className={`text-sm md:text-base font-semibold ${isDateToday(day) ? "text-primary" : "text-foreground"}`}>
                {format(day, "d")}
              </p>
            </div>
          ))}
        </div>
        {/* Time grid */}
        <div className="overflow-y-auto max-h-[55vh]">
          {HOURS.map(hour => (
            <div key={hour} className="flex border-t border-border min-h-[50px]">
              <div className="w-12 md:w-16 flex-shrink-0 text-[10px] md:text-xs text-muted-foreground py-1 text-right pr-2">
                {`${hour.toString().padStart(2, "0")}:00`}
              </div>
              {weekDays.map(day => {
                const dayHourAppts = filteredAppointments.filter(a => {
                  const s = new Date(a.starts_at);
                  return isSameDay(s, day) && s.getHours() === hour;
                });
                return (
                  <div
                    key={day.toISOString()}
                    className={`flex-1 relative border-l border-border/50 hover:bg-primary/5 cursor-pointer transition-colors ${
                      isDateToday(day) ? "bg-primary/[0.03]" : ""
                    }`}
                    onClick={() => openNewAppointment(`${hour.toString().padStart(2, "0")}:00`, day)}
                  >
                    {dayHourAppts.map(apt => {
                      const start = new Date(apt.starts_at);
                      const end = new Date(apt.ends_at);
                      const topOffset = start.getMinutes() * (50 / 60);
                      const duration = Math.max((end.getTime() - start.getTime()) / 60000 * (50 / 60), 14);
                      return (
                        <div
                          key={apt.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); setDetailDialog(true); }}
                          className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden z-10 text-white border border-background/20"
                          style={{
                            top: `${topOffset}px`,
                            height: `${duration}px`,
                            backgroundColor: profColorMap[apt.professional_id] || "hsl(var(--primary))",
                          }}
                        >
                          <p className="text-[9px] md:text-[10px] font-semibold truncate">
                            {format(start, "HH:mm")} {apt.patient_name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Month View ──
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const renderMonthView = () => (
    <div>
      <div className="grid grid-cols-7 gap-0.5 md:gap-1">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <div key={`h-${i}`} className="h-6 md:h-8 flex items-center justify-center text-[10px] md:text-xs font-medium text-muted-foreground">
            <span className="sm:hidden">{d}</span>
            <span className="hidden sm:inline">{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][i]}</span>
          </div>
        ))}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`e-${i}`} className="h-14 md:h-24 bg-muted/30 rounded-md" />
        ))}
        {monthDays.map(date => {
          const dayAppts = filteredAppointments.filter(a => isSameDay(new Date(a.starts_at), date));
          const today = isDateToday(date);
          return (
            <div
              key={date.toISOString()}
              onClick={() => { setSelectedDate(date); setView("day"); }}
              className={`h-14 md:h-24 p-0.5 md:p-1 rounded-md md:rounded-lg border cursor-pointer transition-all ${
                today ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <div className={`text-[10px] md:text-xs font-medium mb-0.5 text-center md:text-left ${today ? "text-primary" : "text-muted-foreground"}`}>
                {format(date, "d")}
              </div>
              <div className="hidden md:block space-y-0.5 overflow-y-auto max-h-14">
                {dayAppts.slice(0, 3).map(apt => (
                  <div
                    key={apt.id}
                    className="text-[9px] px-1 py-0.5 rounded truncate text-white"
                    style={{ backgroundColor: profColorMap[apt.professional_id] || "hsl(var(--primary))" }}
                  >
                    {format(new Date(apt.starts_at), "HH:mm")} {apt.patient_name}
                  </div>
                ))}
                {dayAppts.length > 3 && (
                  <div className="text-[9px] text-muted-foreground text-center">+{dayAppts.length - 3}</div>
                )}
              </div>
              {dayAppts.length > 0 && (
                <div className="md:hidden flex justify-center gap-0.5 mt-0.5">
                  {dayAppts.slice(0, 3).map(apt => (
                    <div
                      key={apt.id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: profColorMap[apt.professional_id] || "hsl(var(--primary))" }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Day Agenda (below calendar) ──
  const agendaAppts = useMemo(() =>
    filteredAppointments
      .filter(a => isSameDay(new Date(a.starts_at), selectedDate))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [filteredAppointments, selectedDate]
  );

  const headerLabel = () => {
    if (view === "day") return format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR });
    if (view === "week") return `${format(weekDays[0], "d MMM", { locale: ptBR })} – ${format(weekDays[6], "d MMM yyyy", { locale: ptBR })}`;
    return format(selectedDate, "MMMM yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-4">
      {/* Main Calendar Card */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-3 px-3 md:px-6">
          {/* Top: view toggle + nav */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {(["day", "week", "month"] as CalendarView[]).map(v => (
                <Button
                  key={v}
                  size="sm"
                  variant={view === v ? "default" : "ghost"}
                  className="h-7 px-3 text-xs"
                  onClick={() => setView(v)}
                >
                  {v === "day" ? "Dia" : v === "week" ? "Semana" : "Mês"}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={goToday}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => navigateDate(-1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs md:text-sm font-medium min-w-32 md:min-w-44 text-center capitalize">
                {headerLabel()}
              </span>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => navigateDate(1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Professional Legend */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Button
              size="sm"
              variant={selectedProfessional === null ? "default" : "outline"}
              className="h-6 px-2 text-[10px] md:text-xs rounded-full"
              onClick={() => setSelectedProfessional(null)}
            >
              Todos
            </Button>
            {professionals.map(p => (
              <Button
                key={p.id}
                size="sm"
                variant="outline"
                className={`h-6 px-2 text-[10px] md:text-xs rounded-full border-2 transition-all ${
                  selectedProfessional === p.id ? "ring-2 ring-offset-1 ring-primary" : ""
                }`}
                style={{ borderColor: profColorMap[p.id], color: selectedProfessional === p.id ? "white" : undefined, backgroundColor: selectedProfessional === p.id ? profColorMap[p.id] : undefined }}
                onClick={() => setSelectedProfessional(prev => prev === p.id ? null : p.id)}
              >
                {p.full_name.split(" ")[0]}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="px-2 md:px-6 pb-3 md:pb-6">
          {view === "day" && renderDayView()}
          {view === "week" && renderWeekView()}
          {view === "month" && renderMonthView()}
        </CardContent>
      </Card>

      {/* Day Agenda Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 px-3 md:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
              Agenda — {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
              <Badge variant="secondary" className="ml-1 text-xs">{agendaAppts.length}</Badge>
            </CardTitle>
            <Button size="sm" className="h-7 text-xs" onClick={() => openNewAppointment()}>
              <Plus className="h-3 w-3 mr-1" /> Novo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          {agendaAppts.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">Nenhum agendamento</p>
          ) : (
            <div className="space-y-2">
              {agendaAppts.map(apt => (
                <div
                  key={apt.id}
                  className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors border border-transparent hover:border-border"
                >
                  <div
                    className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: profColorMap[apt.professional_id] || "hsl(var(--primary))" }}
                  />
                  <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-1 items-center">
                    <p className="font-semibold text-xs md:text-sm text-primary tabular-nums">
                      {format(new Date(apt.starts_at), "HH:mm")}
                    </p>
                    <p className="text-xs md:text-sm text-foreground truncate">{apt.patient_name}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate hidden sm:block">
                      {(apt as any).services?.name}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate hidden sm:block">
                      {(apt as any).professionals?.full_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {getStatusBadge(apt.status)}
                    {apt.status === "pending" && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatusChange(apt.id, "confirmed")}>
                        <Check className="h-3 w-3 text-info" />
                      </Button>
                    )}
                    {apt.status === "confirmed" && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatusChange(apt.id, "completed")}>
                        <ArrowRight className="h-3 w-3 text-accent" />
                      </Button>
                    )}
                    {(apt.status === "pending" || apt.status === "confirmed") && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStatusChange(apt.id, "cancelled")}>
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader><DialogTitle>Detalhes do Agendamento</DialogTitle></DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-12 rounded-full" style={{ backgroundColor: profColorMap[selectedAppointment.professional_id] || "hsl(var(--primary))" }} />
                <div>
                  <p className="font-semibold text-lg">{selectedAppointment.patient_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.patient_phone || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Serviço</p><p className="font-medium text-sm">{(selectedAppointment as any).services?.name || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Profissional</p><p className="font-medium text-sm">{(selectedAppointment as any).professionals?.full_name || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Data</p><p className="font-medium text-sm">{format(new Date(selectedAppointment.starts_at), "d 'de' MMMM", { locale: ptBR })}</p></div>
                <div><p className="text-xs text-muted-foreground">Horário</p><p className="font-medium text-sm">{format(new Date(selectedAppointment.starts_at), "HH:mm")} – {format(new Date(selectedAppointment.ends_at), "HH:mm")}</p></div>
                <div><p className="text-xs text-muted-foreground">Valor</p><p className="font-medium text-sm text-accent">R$ {Number((selectedAppointment as any).services?.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p>{getStatusBadge(selectedAppointment.status)}</div>
              </div>
              {selectedAppointment.notes && (
                <div><p className="text-xs text-muted-foreground">Observações</p><p className="text-sm">{selectedAppointment.notes}</p></div>
              )}
              <div className="flex gap-2 pt-2">
                {selectedAppointment.status === "pending" && (
                  <Button size="sm" onClick={() => { handleStatusChange(selectedAppointment.id, "confirmed"); setDetailDialog(false); }}>Confirmar</Button>
                )}
                {selectedAppointment.status === "confirmed" && (
                  <Button size="sm" onClick={() => { handleStatusChange(selectedAppointment.id, "completed"); setDetailDialog(false); }}>Concluir</Button>
                )}
                {(selectedAppointment.status === "pending" || selectedAppointment.status === "confirmed") && (
                  <Button size="sm" variant="destructive" onClick={() => { handleStatusChange(selectedAppointment.id, "cancelled"); setDetailDialog(false); }}>Cancelar</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Appointment Dialog */}
      <Dialog open={newDialog} onOpenChange={setNewDialog}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Agendamento</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Nome do Paciente *</Label>
              <Input value={formData.patient_name} onChange={e => setFormData({ ...formData, patient_name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Telefone</Label><Input value={formData.patient_phone} onChange={e => setFormData({ ...formData, patient_phone: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input type="email" value={formData.patient_email} onChange={e => setFormData({ ...formData, patient_email: e.target.value })} /></div>
            </div>
            <div>
              <Label>Serviço *</Label>
              <Select value={formData.service_id} onValueChange={v => setFormData({ ...formData, service_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{services.filter(s => s.status === "active").map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.duration_minutes}min)</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Profissional *</Label>
              <Select value={formData.professional_id} onValueChange={v => setFormData({ ...formData, professional_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.date, "PPP", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={formData.date} onSelect={d => d && setFormData({ ...formData, date: d })} locale={ptBR} />
                  </PopoverContent>
                </Popover>
              </div>
              <div><Label>Horário *</Label><Input type="time" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} required /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setNewDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>Criar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClinicCalendar;
