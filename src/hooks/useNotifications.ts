import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
}

export function useNotifications() {
  const { clinic } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!clinic?.id) return;

    const channel = supabase
      .channel("appointments-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
          filter: `clinic_id=eq.${clinic.id}`,
        },
        (payload) => {
          const apt = payload.new as any;
          if (apt.origin === "whatsapp" || apt.origin === "chatbot") {
            const originLabel = apt.origin === "whatsapp" ? "WhatsApp" : "Chatbot";
            const timeStr = format(new Date(apt.starts_at), "dd/MM HH:mm", { locale: ptBR });
            const title = `Novo agendamento via ${originLabel}`;
            const description = `${apt.patient_name} — ${timeStr}`;

            toast(title, { description });

            setNotifications((prev) => [
              {
                id: apt.id,
                title,
                description,
                createdAt: apt.created_at,
                read: false,
              },
              ...prev,
            ].slice(0, 20));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinic?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return { notifications, unreadCount, markAllRead };
}
