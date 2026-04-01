import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAppointments, useProfessionals, useServices, useCreateAppointment, useUpdateAppointment } from "@/hooks/useClinicData";

const Appointments = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: appointments = [], isLoading: loadingAppts } = useAppointments({ date: selectedDate });
  const { data: professionals = [] } = useProfessionals();
  const { data: services = [] } = useServices();
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();

  const [formData, setFormData] = useState({
    patient_name: "", patient_phone: "", patient_email: "",
    service_id: "", professional_id: "", date: new Date(), time: "", notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedService = services.find((s) => s.id === formData.service_id);
    if (!selectedService) return;

    const [hours, minutes] = formData.time.split(":").map(Number);
    const startsAt = new Date(formData.date);
    startsAt.setHours(hours, minutes, 0, 0);
    const endsAt = new Date(startsAt);
    endsAt.setMinutes(endsAt.getMinutes() + selectedService.duration_minutes);

    createMutation.mutate({
      patient_name: formData.patient_name,
      patient_phone: formData.patient_phone || undefined,
      patient_email: formData.patient_email || undefined,
      service_id: formData.service_id,
      professional_id: formData.professional_id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      notes: formData.notes || undefined,
    }, {
      onSuccess: () => { setDialogOpen(false); resetForm(); },
    });
  };

  const resetForm = () => {
    setFormData({ patient_name: "", patient_phone: "", patient_email: "", service_id: "", professional_id: "", date: new Date(), time: "", notes: "" });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateMutation.mutate({ id, status });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { pending: "bg-yellow-500", confirmed: "bg-blue-500", completed: "bg-green-500", cancelled: "bg-red-500" };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { pending: "Pendente", confirmed: "Confirmado", completed: "Concluído", cancelled: "Cancelado" };
    return labels[status] || status;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-background">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Agendamentos</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie os agendamentos da clínica</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Novo Agendamento</Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo Agendamento</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="patient_name">Nome do Paciente *</Label>
                <Input id="patient_name" value={formData.patient_name} onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label htmlFor="patient_phone">Telefone</Label><Input id="patient_phone" value={formData.patient_phone} onChange={(e) => setFormData({ ...formData, patient_phone: e.target.value })} /></div>
                <div><Label htmlFor="patient_email">E-mail</Label><Input id="patient_email" type="email" value={formData.patient_email} onChange={(e) => setFormData({ ...formData, patient_email: e.target.value })} /></div>
              </div>
              <div>
                <Label>Serviço *</Label>
                <Select value={formData.service_id} onValueChange={(value) => setFormData({ ...formData, service_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um serviço" /></SelectTrigger>
                  <SelectContent>
                    {services.filter(s => s.status === "active").map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Profissional *</Label>
                <Select value={formData.professional_id} onValueChange={(value) => setFormData({ ...formData, professional_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um profissional" /></SelectTrigger>
                  <SelectContent>
                    {professionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name} - {p.specialty}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <Calendar mode="single" selected={formData.date} onSelect={(date) => date && setFormData({ ...formData, date })} locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div><Label htmlFor="time">Horário *</Label><Input id="time" type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} required /></div>
              </div>
              <div><Label htmlFor="notes">Observações</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending}>Criar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <Label className="text-sm font-medium">Data</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:max-w-xs mt-1">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "PPP", { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} locale={ptBR} />
          </PopoverContent>
        </Popover>
      </div>

      {loadingAppts ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <div key={apt.id} className="border border-border rounded-lg p-3 md:p-4 hover:bg-accent/50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(apt.status)}`} />
                    <h3 className="font-semibold text-base md:text-lg truncate">{apt.patient_name}</h3>
                    <Badge variant="outline" className="text-xs">{getStatusLabel(apt.status)}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1 ml-0 sm:ml-5">
                    <p><span className="font-medium">Serviço:</span> {(apt as any).services?.name || "—"}</p>
                    <p><span className="font-medium">Profissional:</span> {(apt as any).professionals?.full_name || "—"}</p>
                    <p><span className="font-medium">Horário:</span> {format(new Date(apt.starts_at), "HH:mm")} - {format(new Date(apt.ends_at), "HH:mm")}</p>
                    {apt.patient_phone && <p><span className="font-medium">Telefone:</span> {apt.patient_phone}</p>}
                    {apt.notes && <p><span className="font-medium">Obs:</span> {apt.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {apt.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(apt.id, "confirmed")}>Confirmar</Button>
                  )}
                  {apt.status === "confirmed" && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(apt.id, "completed")}>Concluir</Button>
                  )}
                  {(apt.status === "pending" || apt.status === "confirmed") && (
                    <Button size="sm" variant="destructive" onClick={() => handleStatusChange(apt.id, "cancelled")}>Cancelar</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loadingAppts && appointments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum agendamento para esta data</p>
        </div>
      )}
    </div>
  );
};

export default Appointments;
