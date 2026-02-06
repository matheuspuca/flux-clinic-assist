import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Appointment {
  id: string;
  service_id: string;
  professional_id: string;
  patient_name: string;
  patient_phone: string | null;
  patient_email: string | null;
  starts_at: Date;
  ends_at: Date;
  status: string;
  notes: string | null;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
}

interface Professional {
  id: string;
  full_name: string;
  specialty: string;
}

// Dados mock
const mockServices: Service[] = [
  { id: "1", name: "Consulta Geral", duration_minutes: 30 },
  { id: "2", name: "Exame de Pele", duration_minutes: 45 },
  { id: "3", name: "Eletrocardiograma", duration_minutes: 60 },
];

const mockProfessionals: Professional[] = [
  { id: "1", full_name: "Dr. Carlos Silva", specialty: "Clínico Geral" },
  { id: "2", full_name: "Dra. Ana Santos", specialty: "Dermatologia" },
  { id: "3", full_name: "Dr. Pedro Costa", specialty: "Cardiologia" },
];

const today = new Date();
const initialAppointments: Appointment[] = [
  {
    id: "1",
    service_id: "1",
    professional_id: "1",
    patient_name: "João Silva",
    patient_phone: "(11) 99999-0001",
    patient_email: "joao@email.com",
    starts_at: new Date(today.setHours(9, 0, 0, 0)),
    ends_at: new Date(today.setHours(9, 30, 0, 0)),
    status: "confirmed",
    notes: null,
  },
  {
    id: "2",
    service_id: "2",
    professional_id: "2",
    patient_name: "Maria Santos",
    patient_phone: "(11) 99999-0002",
    patient_email: null,
    starts_at: new Date(new Date().setHours(10, 30, 0, 0)),
    ends_at: new Date(new Date().setHours(11, 15, 0, 0)),
    status: "pending",
    notes: "Primeira consulta",
  },
  {
    id: "3",
    service_id: "3",
    professional_id: "3",
    patient_name: "Pedro Costa",
    patient_phone: "(11) 99999-0003",
    patient_email: "pedro@email.com",
    starts_at: new Date(new Date().setHours(14, 0, 0, 0)),
    ends_at: new Date(new Date().setHours(15, 0, 0, 0)),
    status: "pending",
    notes: null,
  },
];

const Appointments = () => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [services] = useState<Service[]>(mockServices);
  const [professionals] = useState<Professional[]>(mockProfessionals);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [formData, setFormData] = useState({
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    service_id: "",
    professional_id: "",
    date: new Date(),
    time: "",
    notes: "",
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

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      service_id: formData.service_id,
      professional_id: formData.professional_id,
      patient_name: formData.patient_name,
      patient_phone: formData.patient_phone || null,
      patient_email: formData.patient_email || null,
      starts_at: startsAt,
      ends_at: endsAt,
      status: "pending",
      notes: formData.notes || null,
    };

    setAppointments([...appointments, newAppointment]);
    toast({
      title: "Sucesso",
      description: "Agendamento criado com sucesso",
    });
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      patient_name: "",
      patient_phone: "",
      patient_email: "",
      service_id: "",
      professional_id: "",
      date: new Date(),
      time: "",
      notes: "",
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "Pendente",
      confirmed: "Confirmado",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getServiceName = (serviceId: string) => {
    return services.find(s => s.id === serviceId)?.name || "Serviço";
  };

  const getProfessionalName = (professionalId: string) => {
    return professionals.find(p => p.id === professionalId)?.full_name || "Profissional";
  };

  const filteredAppointments = appointments.filter(apt => 
    isSameDay(apt.starts_at, selectedDate)
  ).sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-background">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Agendamentos</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie os agendamentos da clínica
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="patient_name">Nome do Paciente *</Label>
                <Input
                  id="patient_name"
                  value={formData.patient_name}
                  onChange={(e) =>
                    setFormData({ ...formData, patient_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient_phone">Telefone</Label>
                  <Input
                    id="patient_phone"
                    value={formData.patient_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, patient_phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="patient_email">E-mail</Label>
                  <Input
                    id="patient_email"
                    type="email"
                    value={formData.patient_email}
                    onChange={(e) =>
                      setFormData({ ...formData, patient_email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="service">Serviço *</Label>
                <Select
                  value={formData.service_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, service_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.duration_minutes} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="professional">Profissional *</Label>
                <Select
                  value={formData.professional_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, professional_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.full_name} - {prof.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Data *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.date, "PPP", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) =>
                          date && setFormData({ ...formData, date })
                        }
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="time">Horário *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">Criar</Button>
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
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-3">
        {filteredAppointments.map((apt) => (
          <div
            key={apt.id}
            className="border border-border rounded-lg p-3 md:p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(
                      apt.status
                    )}`}
                  />
                  <h3 className="font-semibold text-base md:text-lg truncate">{apt.patient_name}</h3>
                  <Badge variant="outline" className="text-xs">{getStatusLabel(apt.status)}</Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1 ml-0 sm:ml-5">
                  <p>
                    <span className="font-medium">Serviço:</span>{" "}
                    {getServiceName(apt.service_id)}
                  </p>
                  <p>
                    <span className="font-medium">Profissional:</span>{" "}
                    {getProfessionalName(apt.professional_id)}
                  </p>
                  <p>
                    <span className="font-medium">Horário:</span>{" "}
                    {format(apt.starts_at, "HH:mm")} -{" "}
                    {format(apt.ends_at, "HH:mm")}
                  </p>
                  {apt.patient_phone && (
                    <p>
                      <span className="font-medium">Telefone:</span>{" "}
                      {apt.patient_phone}
                    </p>
                  )}
                  {apt.notes && (
                    <p>
                      <span className="font-medium">Obs:</span> {apt.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAppointments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum agendamento para esta data
          </p>
        </div>
      )}
    </div>
  );
};

export default Appointments;
