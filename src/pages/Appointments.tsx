import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { format } from "date-fns";
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
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  services: { name: string };
  professionals: { full_name: string };
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

const Appointments = () => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchAppointments();
    fetchServices();
    fetchProfessionals();
  }, [selectedDate]);

  useEffect(() => {
    const channel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  const fetchAppointments = async () => {
    setLoading(true);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        *,
        services(name),
        professionals(full_name)
      `
      )
      .gte("starts_at", startOfDay.toISOString())
      .lte("starts_at", endOfDay.toISOString())
      .order("starts_at");

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar agendamentos",
        variant: "destructive",
      });
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("id, name, duration_minutes")
      .eq("status", "active")
      .order("name");
    setServices(data || []);
  };

  const fetchProfessionals = async () => {
    const { data } = await supabase
      .from("professionals")
      .select("id, full_name, specialty")
      .order("full_name");
    setProfessionals(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedService = services.find((s) => s.id === formData.service_id);
    if (!selectedService) return;

    const [hours, minutes] = formData.time.split(":").map(Number);
    const startsAt = new Date(formData.date);
    startsAt.setHours(hours, minutes, 0, 0);

    const endsAt = new Date(startsAt);
    endsAt.setMinutes(endsAt.getMinutes() + selectedService.duration_minutes);

    // Buscar a primeira clínica disponível
    const { data: clinicData } = await supabase
      .from("clinics")
      .select("id")
      .limit(1)
      .single();

    const { error } = await supabase.from("appointments").insert({
      clinic_id: clinicData?.id,
      service_id: formData.service_id,
      professional_id: formData.professional_id,
      patient_name: formData.patient_name,
      patient_phone: formData.patient_phone || null,
      patient_email: formData.patient_email || null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "pending",
      origin: "manual",
      notes: formData.notes || null,
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar agendamento",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso",
      });
      setDialogOpen(false);
      resetForm();
    }
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

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie os agendamentos da clínica
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
        <Label>Data</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full max-w-xs">
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

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${getStatusColor(
                        apt.status
                      )}`}
                    />
                    <h3 className="font-semibold text-lg">{apt.patient_name}</h3>
                    <Badge variant="outline">{getStatusLabel(apt.status)}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1 ml-6">
                    <p>
                      <span className="font-medium">Serviço:</span>{" "}
                      {apt.services.name}
                    </p>
                    <p>
                      <span className="font-medium">Profissional:</span>{" "}
                      {apt.professionals.full_name}
                    </p>
                    <p>
                      <span className="font-medium">Horário:</span>{" "}
                      {format(new Date(apt.starts_at), "HH:mm")} -{" "}
                      {format(new Date(apt.ends_at), "HH:mm")}
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
      )}

      {!loading && appointments.length === 0 && (
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
