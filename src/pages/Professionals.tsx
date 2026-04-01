import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";
import { BIChart } from "@/components/dashboard/BIChart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAllAppointments } from "@/hooks/useClinicData";
import { toast } from "sonner";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfessionals, useCreateProfessional, useUpdateProfessional, useDeleteProfessional } from "@/hooks/useClinicData";

const professionalSchema = z.object({
  full_name: z.string().trim().min(1, "Nome é obrigatório").max(100),
  specialty: z.string().trim().min(1, "Especialidade é obrigatória").max(100),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
});

const Professionals = () => {
  const { data: professionals = [], isLoading } = useProfessionals();
  const createMutation = useCreateProfessional();
  const updateMutation = useUpdateProfessional();
  const deleteMutation = useDeleteProfessional();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [formData, setFormData] = useState({ full_name: "", specialty: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = professionals.filter((p) => {
    const matchesSearch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = specialtyFilter === "all" || p.specialty === specialtyFilter;
    return matchesSearch && matchesSpecialty;
  });

  const uniqueSpecialties = Array.from(new Set(professionals.map((p) => p.specialty)));

  const handleOpenDialog = (professional?: typeof professionals[0]) => {
    if (professional) {
      setEditingId(professional.id);
      setFormData({ full_name: professional.full_name, specialty: professional.specialty, phone: professional.phone || "", email: professional.email || "" });
    } else {
      setEditingId(null);
      setFormData({ full_name: "", specialty: "", phone: "", email: "" });
    }
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = professionalSchema.parse(formData);
      const payload = { full_name: validated.full_name, specialty: validated.specialty, phone: validated.phone || undefined, email: validated.email || undefined };
      if (editingId) {
        updateMutation.mutate({ id: editingId, ...payload }, { onSuccess: () => setIsDialogOpen(false) });
      } else {
        createMutation.mutate(payload, { onSuccess: () => setIsDialogOpen(false) });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => { if (err.path[0]) newErrors[err.path[0] as string] = err.message; });
        setErrors(newErrors);
      }
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este profissional?")) return;
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Profissionais</h1>
            <p className="text-sm md:text-base text-muted-foreground">Gerencie os profissionais da clínica</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Adicionar Profissional
          </Button>
        </div>

        <Card className="p-3 md:p-4 border-border">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Buscar por nome ou especialidade..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Filtrar por especialidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as especialidades</SelectItem>
                {uniqueSpecialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filtered.map((professional) => (
            <Card key={professional.id} className="p-4 md:p-6 border-border hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-semibold text-card-foreground">{professional.full_name}</h3>
                  <Badge className="mt-1 bg-primary/10 text-primary border-primary/20">{professional.specialty}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(professional)} className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(professional.id)} className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="space-y-1 pt-2 border-t border-border">
                {professional.phone && <p className="text-sm text-muted-foreground">📞 {professional.phone}</p>}
                {professional.email && <p className="text-sm text-muted-foreground">✉️ {professional.email}</p>}
              </div>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <Card className="p-12 text-center border-border">
            <p className="text-muted-foreground">Nenhum profissional encontrado</p>
          </Card>
        )}

        <ProfessionalPerformanceChart professionals={professionals} />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Profissional" : "Adicionar Profissional"}</DialogTitle>
              <DialogDescription>Preencha os dados do profissional</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input id="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                  {errors.full_name && <p className="text-sm text-destructive mt-1">{errors.full_name}</p>}
                </div>
                <div>
                  <Label htmlFor="specialty">Especialidade *</Label>
                  <Input id="specialty" value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} />
                  {errors.specialty && <p className="text-sm text-destructive mt-1">{errors.specialty}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Atualizar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

function ProfessionalPerformanceChart({ professionals }: { professionals: typeof Array<any> extends never ? any : any[] }) {
  const { data: appointments = [] } = useAllAppointments();
  const COLORS = ["hsl(220,70%,50%)", "hsl(160,60%,42%)", "hsl(38,92%,50%)", "hsl(280,55%,55%)", "hsl(340,65%,50%)"];

  const data = professionals.map((p, i) => {
    const completed = appointments.filter((a: any) => a.professional_id === p.id && a.status === "completed");
    return {
      name: p.full_name.split(" ").slice(0, 2).join(" "),
      atendimentos: completed.length,
      receita: completed.reduce((acc: number, a: any) => acc + Number(a.services?.price || 0), 0),
      fill: COLORS[i % COLORS.length],
    };
  });

  if (data.every(d => d.atendimentos === 0)) return null;

  return (
    <BIChart title="Desempenho por Profissional" icon={Users}>
      <div className="h-44 md:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={90} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
            <Bar dataKey="atendimentos" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 pt-3 border-t border-border space-y-1">
        {data.map((p) => (
          <div key={p.name} className="flex justify-between text-xs">
            <span className="text-muted-foreground">{p.name}</span>
            <span className="font-medium text-accent">R$ {p.receita.toLocaleString("pt-BR")}</span>
          </div>
        ))}
      </div>
    </BIChart>
  );
}

export default Professionals;
