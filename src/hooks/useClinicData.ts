import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── Professionals ───
export function useProfessionals() {
  const { clinic } = useAuth();
  return useQuery({
    queryKey: ["professionals", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !!clinic?.id,
  });
}

export function useCreateProfessional() {
  const qc = useQueryClient();
  const { clinic } = useAuth();
  return useMutation({
    mutationFn: async (values: { full_name: string; specialty: string; phone?: string; email?: string }) => {
      if (!clinic?.id) throw new Error("Sem clínica");
      const { data, error } = await supabase
        .from("professionals")
        .insert({ ...values, clinic_id: clinic.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional adicionado");
    },
    onError: (e: Error) => toast.error("Erro ao adicionar profissional", { description: e.message }),
  });
}

export function useUpdateProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; full_name?: string; specialty?: string; phone?: string; email?: string }) => {
      const { error } = await supabase.from("professionals").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional atualizado");
    },
    onError: (e: Error) => toast.error("Erro ao atualizar", { description: e.message }),
  });
}

export function useDeleteProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("professionals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["professionals"] });
      toast.success("Profissional removido");
    },
    onError: (e: Error) => toast.error("Erro ao remover", { description: e.message }),
  });
}

// ─── Services ───
export function useServices() {
  const { clinic } = useAuth();
  return useQuery({
    queryKey: ["services", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!clinic?.id,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  const { clinic } = useAuth();
  return useMutation({
    mutationFn: async (values: { name: string; description?: string; duration_minutes: number; price: number; status?: string }) => {
      if (!clinic?.id) throw new Error("Sem clínica");
      const { data, error } = await supabase
        .from("services")
        .insert({ ...values, clinic_id: clinic.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço criado");
    },
    onError: (e: Error) => toast.error("Erro ao criar serviço", { description: e.message }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; name?: string; description?: string; duration_minutes?: number; price?: number; status?: string }) => {
      const { error } = await supabase.from("services").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço atualizado");
    },
    onError: (e: Error) => toast.error("Erro ao atualizar", { description: e.message }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço removido");
    },
    onError: (e: Error) => toast.error("Erro ao remover", { description: e.message }),
  });
}

// ─── Appointments ───
export function useAppointments(filters?: { date?: Date; professionalId?: string; status?: string }) {
  const { clinic } = useAuth();
  return useQuery({
    queryKey: ["appointments", clinic?.id, filters?.date?.toISOString(), filters?.professionalId, filters?.status],
    queryFn: async () => {
      if (!clinic?.id) return [];
      let query = supabase
        .from("appointments")
        .select("*, professionals(full_name, specialty), services(name, duration_minutes, price)")
        .eq("clinic_id", clinic.id)
        .order("starts_at", { ascending: true });

      if (filters?.professionalId) {
        query = query.eq("professional_id", filters.professionalId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.date) {
        const start = new Date(filters.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.date);
        end.setHours(23, 59, 59, 999);
        query = query.gte("starts_at", start.toISOString()).lte("starts_at", end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!clinic?.id,
  });
}

export function useAllAppointments() {
  const { clinic } = useAuth();
  return useQuery({
    queryKey: ["appointments-all", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select("*, professionals(full_name, specialty), services(name, duration_minutes, price)")
        .eq("clinic_id", clinic.id)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!clinic?.id,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  const { clinic } = useAuth();
  return useMutation({
    mutationFn: async (values: {
      patient_name: string;
      patient_phone?: string;
      patient_email?: string;
      service_id: string;
      professional_id: string;
      starts_at: string;
      ends_at: string;
      notes?: string;
      status?: string;
    }) => {
      if (!clinic?.id) throw new Error("Sem clínica");
      const { data, error } = await supabase
        .from("appointments")
        .insert({ ...values, clinic_id: clinic.id, origin: "manual" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["appointments-all"] });
      toast.success("Agendamento criado");
    },
    onError: (e: Error) => toast.error("Erro ao criar agendamento", { description: e.message }),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: string; status?: string; notes?: string; starts_at?: string; ends_at?: string }) => {
      const { error } = await supabase.from("appointments").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["appointments-all"] });
      toast.success("Agendamento atualizado");
    },
    onError: (e: Error) => toast.error("Erro ao atualizar", { description: e.message }),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["appointments-all"] });
      toast.success("Agendamento removido");
    },
    onError: (e: Error) => toast.error("Erro ao remover", { description: e.message }),
  });
}

// ─── Patients ───
export function usePatients() {
  const { clinic } = useAuth();
  return useQuery({
    queryKey: ["patients", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!clinic?.id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  const { clinic } = useAuth();
  return useMutation({
    mutationFn: async (values: { name: string; phone?: string; email?: string; notes?: string }) => {
      if (!clinic?.id) throw new Error("Sem clínica");
      const { data, error } = await supabase
        .from("patients")
        .insert({ ...values, clinic_id: clinic.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente cadastrado");
    },
    onError: (e: Error) => toast.error("Erro ao cadastrar paciente", { description: e.message }),
  });
}
