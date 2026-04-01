import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare, CalendarCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ChatbotLogs = () => {
  const { clinic } = useAuth();
  const [search, setSearch] = useState("");
  const [intentFilter, setIntentFilter] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["chatbot-logs", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data, error } = await supabase
        .from("chatbot_logs")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!clinic?.id,
  });

  const filtered = logs.filter((log) => {
    const matchSearch =
      !search ||
      log.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.message.toLowerCase().includes(search.toLowerCase());
    const matchIntent = intentFilter === "all" || log.intent === intentFilter;
    return matchSearch && matchIntent;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Chatbot Logs</h1>
        <p className="text-sm text-muted-foreground">Histórico de conversas do chatbot com pacientes</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por paciente ou mensagem..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={intentFilter} onValueChange={setIntentFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="conversation">Conversa</SelectItem>
            <SelectItem value="appointment_created">Agendamento Criado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Conversas ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum log encontrado</h3>
              <p className="text-sm text-muted-foreground">As conversas do chatbot aparecerão aqui automaticamente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Resposta</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm">{log.patient_name || "—"}</TableCell>
                      <TableCell className="text-sm">{log.patient_phone || "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{log.message}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{log.response}</TableCell>
                      <TableCell>
                        {log.intent === "appointment_created" ? (
                          <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                            <CalendarCheck className="h-3 w-3" /> Agendamento
                          </Badge>
                        ) : (
                          <Badge variant="outline">Conversa</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatbotLogs;
