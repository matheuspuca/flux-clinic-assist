import { useState, useMemo } from "react";
import { useAllAppointments, usePatients } from "@/hooks/useClinicData";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { CreatePatientDialog } from "@/components/patients/CreatePatientDialog";

interface Patient {
  name: string;
  phone: string | null;
  email: string | null;
  totalAppointments: number;
  lastAppointment: string;
  totalSpent: number;
  servicesUsed: string[];
}

const statusConfig: Record<string, { label: string; variant: "outline" | "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pendente", variant: "outline" },
  confirmed: { label: "Confirmado", variant: "default" },
  completed: { label: "Concluído", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

export default function Patients() {
  const { data: appointments, isLoading } = useAllAppointments();
  const { data: registeredPatients, isLoading: isLoadingPatients } = usePatients();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const patients = useMemo(() => {
    const map = new Map<string, Patient>();

    // Add from appointments
    if (appointments?.length) {
      for (const apt of appointments) {
        const key = `${apt.patient_name}||${apt.patient_phone || ""}||${apt.patient_email || ""}`;
        const existing = map.get(key);
        const serviceName = (apt.services as any)?.name || "";
        const servicePrice = (apt.services as any)?.price || 0;
        const isCompleted = apt.status === "completed";

        if (existing) {
          existing.totalAppointments++;
          if (apt.starts_at > existing.lastAppointment) existing.lastAppointment = apt.starts_at;
          if (isCompleted) existing.totalSpent += Number(servicePrice);
          if (serviceName && !existing.servicesUsed.includes(serviceName)) {
            existing.servicesUsed.push(serviceName);
          }
        } else {
          map.set(key, {
            name: apt.patient_name,
            phone: apt.patient_phone,
            email: apt.patient_email,
            totalAppointments: 1,
            lastAppointment: apt.starts_at,
            totalSpent: isCompleted ? Number(servicePrice) : 0,
            servicesUsed: serviceName ? [serviceName] : [],
          });
        }
      }
    }

    // Merge registered patients (add if not already present from appointments)
    if (registeredPatients?.length) {
      for (const rp of registeredPatients) {
        const key = `${rp.name}||${rp.phone || ""}||${rp.email || ""}`;
        if (!map.has(key)) {
          map.set(key, {
            name: rp.name,
            phone: rp.phone,
            email: rp.email,
            totalAppointments: 0,
            lastAppointment: rp.created_at,
            totalSpent: 0,
            servicesUsed: [],
          });
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastAppointment).getTime() - new Date(a.lastAppointment).getTime()
    );
  }, [appointments, registeredPatients]);

  const filtered = useMemo(() => {
    if (!search) return patients;
    const q = search.toLowerCase();
    return patients.filter(
      (p) => p.name.toLowerCase().includes(q) || p.phone?.includes(q)
    );
  }, [patients, search]);

  const patientAppointments = useMemo(() => {
    if (!selectedPatient || !appointments) return [];
    return appointments
      .filter((a) => a.patient_name === selectedPatient.name && a.patient_phone === selectedPatient.phone)
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
  }, [selectedPatient, appointments]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground">{patients.length} paciente(s) encontrado(s)</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Consultas</TableHead>
              <TableHead>Última Visita</TableHead>
              <TableHead className="text-right">Total Gasto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <UserCheck className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  Nenhum paciente encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p, i) => (
                <TableRow
                  key={i}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedPatient(p)}
                >
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.phone || "—"}</TableCell>
                  <TableCell>{p.email || "—"}</TableCell>
                  <TableCell className="text-center">{p.totalAppointments}</TableCell>
                  <TableCell>
                    {format(new Date(p.lastAppointment), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {p.totalSpent.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedPatient?.name}</SheetTitle>
            <SheetDescription>
              {selectedPatient?.phone || "Sem telefone"} · {selectedPatient?.email || "Sem email"}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{selectedPatient?.totalAppointments}</p>
              <p className="text-xs text-muted-foreground">Consultas</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                R$ {selectedPatient?.totalSpent.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Total Gasto</p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{selectedPatient?.servicesUsed.length}</p>
              <p className="text-xs text-muted-foreground">Serviços</p>
            </div>
          </div>

          <h3 className="mt-6 mb-3 font-semibold text-foreground">Histórico de Agendamentos</h3>
          <ScrollArea className="h-[calc(100vh-320px)]">
            <div className="space-y-3 pr-3">
              {patientAppointments.map((apt) => {
                const st = statusConfig[apt.status] || statusConfig.pending;
                return (
                  <div key={apt.id} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {format(new Date(apt.starts_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(apt.services as any)?.name} · {(apt.professionals as any)?.full_name}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      R$ {Number((apt.services as any)?.price || 0).toFixed(2)}
                    </p>
                  </div>
                );
              })}
              {patientAppointments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum agendamento</p>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
