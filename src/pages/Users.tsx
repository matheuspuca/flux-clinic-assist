import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Shield, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type AppRole = "admin" | "profissional" | "atendente";

const roleBadge: Record<AppRole, { label: string; variant: "default" | "secondary" | "outline" }> = {
  admin: { label: "Admin", variant: "default" },
  profissional: { label: "Profissional", variant: "secondary" },
  atendente: { label: "Atendente", variant: "outline" },
};

const Users = () => {
  const { toast } = useToast();
  const { clinic } = useAuth();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("atendente");
  const [editingUser, setEditingUser] = useState<{ userId: string; currentRole: AppRole } | null>(null);
  const [newRole, setNewRole] = useState<AppRole>("atendente");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["clinic-users", clinic?.id],
    queryFn: async () => {
      if (!clinic?.id) return [];
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, created_at")
        .eq("clinic_id", clinic.id);
      if (error) throw error;

      const userIds = profiles.map((p) => p.id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role as AppRole]) ?? []);

      return profiles.map((p) => ({
        ...p,
        role: roleMap.get(p.id) ?? ("atendente" as AppRole),
      }));
    },
    enabled: !!clinic?.id,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-users"] });
      setEditingUser(null);
      toast({ title: "Role atualizado com sucesso" });
    },
    onError: () => toast({ title: "Erro ao atualizar role", variant: "destructive" }),
  });

  const removeAccessMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-users"] });
      toast({ title: "Acesso revogado com sucesso" });
    },
    onError: () => toast({ title: "Erro ao revogar acesso", variant: "destructive" }),
  });

  const handleInvite = () => {
    if (!inviteEmail || !clinic?.id) return;
    const link = `${window.location.origin}/register?clinic_id=${clinic.id}&role=${inviteRole}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link de convite copiado!", description: `Envie o link para ${inviteEmail}` });
    setInviteOpen(false);
    setInviteEmail("");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerencie os usuários da sua clínica</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="mr-2 h-4 w-4" />Convidar Usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Convidar Usuário</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="atendente">Atendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInvite} className="w-full">Gerar Link de Convite</Button>
              <p className="text-xs text-muted-foreground">O link será copiado para a área de transferência. Envie ao usuário para que ele se cadastre.</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Membros da Clínica</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => {
                    const badge = roleBadge[u.role];
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name}</TableCell>
                        <TableCell>{u.phone || "—"}</TableCell>
                        <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                        <TableCell>{format(new Date(u.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Dialog open={editingUser?.userId === u.id} onOpenChange={(o) => { if (!o) setEditingUser(null); }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => { setEditingUser({ userId: u.id, currentRole: u.role }); setNewRole(u.role); }}>
                                <Shield className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Alterar Role</DialogTitle></DialogHeader>
                              <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">Alterar role de <strong>{u.full_name}</strong></p>
                                <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="profissional">Profissional</SelectItem>
                                    <SelectItem value="atendente">Atendente</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button onClick={() => updateRoleMutation.mutate({ userId: u.id, role: newRole })} className="w-full">Salvar</Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeAccessMutation.mutate(u.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
