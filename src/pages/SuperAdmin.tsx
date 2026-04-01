import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Building2, Users, MessageSquare, Calendar, Search, Eye, ShieldCheck } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Navigate } from "react-router-dom";

type AppRole = "admin" | "profissional" | "atendente";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--info))"];

export default function SuperAdmin() {
  const { isSuperAdmin, startImpersonation } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedClinicId, setSelectedClinicId] = useState<string>("all");
  const [dateRange, setDateRange] = useState("30");

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  // Fetch all clinics
  const { data: clinics = [], isLoading: loadingClinics } = useQuery({
    queryKey: ["sa-clinics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinics").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all profiles
  const { data: allProfiles = [] } = useQuery({
    queryKey: ["sa-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all user roles
  const { data: allRoles = [] } = useQuery({
    queryKey: ["sa-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all appointments for analytics
  const { data: allAppointments = [] } = useQuery({
    queryKey: ["sa-appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, clinic_id, starts_at, status, origin, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data;
    },
  });

  // Fetch chatbot logs for message volume
  const { data: allLogs = [] } = useQuery({
    queryKey: ["sa-chatbot-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chatbot_logs")
        .select("id, clinic_id, created_at, intent")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data;
    },
  });

  // Merge profiles + roles
  const usersWithRoles = useMemo(() => {
    const roleMap = new Map(allRoles.map((r) => [r.user_id, r.role as AppRole]));
    return allProfiles.map((p) => ({
      ...p,
      role: roleMap.get(p.id) || ("atendente" as AppRole),
    }));
  }, [allProfiles, allRoles]);

  // Clinic stats
  const clinicStats = useMemo(() => {
    const cutoff = subDays(new Date(), parseInt(dateRange));
    return clinics.map((c) => {
      const users = usersWithRoles.filter((u) => u.clinic_id === c.id);
      const appts = allAppointments.filter((a) => a.clinic_id === c.id);
      const recentAppts = appts.filter((a) => new Date(a.created_at) >= cutoff);
      const logs = allLogs.filter((l) => l.clinic_id === c.id);
      const recentLogs = logs.filter((l) => new Date(l.created_at) >= cutoff);

      return {
        ...c,
        userCount: users.length,
        totalAppointments: appts.length,
        recentAppointments: recentAppts.length,
        totalMessages: logs.length,
        recentMessages: recentLogs.length,
        appointmentsCreated: recentAppts.filter((a) => a.origin === "chatbot" || a.origin === "whatsapp").length,
      };
    });
  }, [clinics, usersWithRoles, allAppointments, allLogs, dateRange]);

  // Message volume by clinic (chart)
  const messageVolumeData = useMemo(() => {
    return clinicStats
      .filter((c) => c.recentMessages > 0)
      .sort((a, b) => b.recentMessages - a.recentMessages)
      .slice(0, 10)
      .map((c) => ({
        name: c.name.length > 15 ? c.name.substring(0, 15) + "..." : c.name,
        mensagens: c.recentMessages,
        agendamentos: c.recentAppointments,
      }));
  }, [clinicStats]);

  // Origin distribution
  const originData = useMemo(() => {
    const cutoff = subDays(new Date(), parseInt(dateRange));
    const recent = allAppointments.filter((a) => new Date(a.created_at) >= cutoff);
    const counts: Record<string, number> = {};
    recent.forEach((a) => { counts[a.origin] = (counts[a.origin] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: name === "manual" ? "Manual" : name === "chatbot" ? "Chatbot" : name === "whatsapp" ? "WhatsApp" : name,
      value,
    }));
  }, [allAppointments, dateRange]);

  // Summary KPIs
  const totalClinics = clinics.length;
  const totalUsers = allProfiles.length;
  const cutoff = subDays(new Date(), parseInt(dateRange));
  const recentAppts = allAppointments.filter((a) => new Date(a.created_at) >= cutoff).length;
  const recentMsgs = allLogs.filter((l) => new Date(l.created_at) >= cutoff).length;

  const filteredClinics = clinicStats.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Users for impersonation
  const filteredUsers = usersWithRoles.filter((u) =>
    selectedClinicId === "all" || u.clinic_id === selectedClinicId
  );

  if (loadingClinics) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Super Admin</h1>
          <p className="text-sm text-muted-foreground">Visão global de todas as clínicas e usuários</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Período:</span>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><Building2 className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Clínicas</span></div>
          <p className="text-2xl font-bold">{totalClinics}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-accent" /><span className="text-xs text-muted-foreground">Usuários</span></div>
          <p className="text-2xl font-bold">{totalUsers}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><Calendar className="h-4 w-4 text-warning" /><span className="text-xs text-muted-foreground">Agendamentos (período)</span></div>
          <p className="text-2xl font-bold">{recentAppts}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><MessageSquare className="h-4 w-4 text-info" /><span className="text-xs text-muted-foreground">Mensagens Chatbot (período)</span></div>
          <p className="text-2xl font-bold">{recentMsgs}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="clinics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clinics">Clínicas</TabsTrigger>
          <TabsTrigger value="users">Impersonar Usuários</TabsTrigger>
          <TabsTrigger value="analytics">Volume de Mensagens</TabsTrigger>
        </TabsList>

        {/* CLÍNICAS */}
        <TabsContent value="clinics" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar clínica..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clínica</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead className="text-center">Usuários</TableHead>
                  <TableHead className="text-center">Agendamentos</TableHead>
                  <TableHead className="text-center">Mensagens</TableHead>
                  <TableHead className="text-center">Via IA</TableHead>
                  <TableHead>Criada em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClinics.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell><Badge variant="outline">{c.area}</Badge></TableCell>
                    <TableCell className="text-center">{c.userCount}</TableCell>
                    <TableCell className="text-center">{c.recentAppointments}</TableCell>
                    <TableCell className="text-center">{c.recentMessages}</TableCell>
                    <TableCell className="text-center">{c.appointmentsCreated}</TableCell>
                    <TableCell className="text-sm">{format(new Date(c.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* IMPERSONAÇÃO */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Impersonar Usuário</CardTitle>
              <CardDescription>Selecione um usuário para ver o sistema como ele vê. Nenhuma ação será tomada em nome dele.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
                <SelectTrigger className="max-w-sm"><SelectValue placeholder="Filtrar por clínica" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as clínicas</SelectItem>
                  {clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Clínica</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const clinicName = clinics.find((c) => c.id === u.clinic_id)?.name || "—";
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.full_name}</TableCell>
                          <TableCell>{clinicName}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === "admin" ? "default" : u.role === "profissional" ? "secondary" : "outline"}>
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startImpersonation({
                                userId: u.id,
                                fullName: u.full_name,
                                clinicId: u.clinic_id,
                                role: u.role,
                              })}
                              className="gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" /> Ver como
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Volume por Clínica</CardTitle>
                <CardDescription>Mensagens do chatbot e agendamentos no período</CardDescription>
              </CardHeader>
              <CardContent>
                {messageVolumeData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados no período</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={messageVolumeData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={110} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                        <Bar dataKey="mensagens" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Mensagens" />
                        <Bar dataKey="agendamentos" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} name="Agendamentos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Origem dos Agendamentos</CardTitle>
                <CardDescription>Distribuição por canal no período</CardDescription>
              </CardHeader>
              <CardContent>
                {originData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados no período</p>
                ) : (
                  <div className="h-64 flex items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={originData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                          {originData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
