import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Calendar, LayoutDashboard, Settings, UserCheck, Users, Briefcase, Search } from "lucide-react";
import { useProfessionals, useServices, useAllAppointments } from "@/hooks/useClinicData";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: professionals = [] } = useProfessionals();
  const { data: services = [] } = useServices();
  const { data: appointments = [] } = useAllAppointments();

  // Derive unique patients
  const patients = Array.from(
    new Map(
      appointments.map((a) => [a.patient_name, { name: a.patient_name, phone: a.patient_phone }])
    ).values()
  ).slice(0, 10);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar pacientes, profissionais, serviços..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Ações Rápidas">
          <CommandItem onSelect={() => go("/appointments")}>
            <Calendar className="mr-2 h-4 w-4" /> Novo Agendamento
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Ver Agenda Hoje
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Settings className="mr-2 h-4 w-4" /> Configurações
          </CommandItem>
        </CommandGroup>

        {patients.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Pacientes">
              {patients.map((p) => (
                <CommandItem key={p.name} onSelect={() => go("/patients")}>
                  <UserCheck className="mr-2 h-4 w-4" /> {p.name} {p.phone ? `· ${p.phone}` : ""}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {professionals.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Profissionais">
              {professionals.slice(0, 5).map((p) => (
                <CommandItem key={p.id} onSelect={() => go("/professionals")}>
                  <Users className="mr-2 h-4 w-4" /> {p.full_name} · {p.specialty}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {services.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Serviços">
              {services.slice(0, 5).map((s) => (
                <CommandItem key={s.id} onSelect={() => go("/services")}>
                  <Briefcase className="mr-2 h-4 w-4" /> {s.name} · R$ {Number(s.price).toFixed(2)}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  return {
    open: () => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
    },
  };
}
