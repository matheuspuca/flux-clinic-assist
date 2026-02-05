import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const professionalSchema = z.object({
  full_name: z.string().trim().min(1, "Nome é obrigatório").max(100),
  specialty: z.string().trim().min(1, "Especialidade é obrigatória").max(100),
  phone: z.string().trim().optional(),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
});

type Professional = {
  id: string;
  full_name: string;
  specialty: string;
  phone?: string;
  email?: string;
};

const Professionals = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [formData, setFormData] = useState({
    full_name: "",
    specialty: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    filterProfessionals();
  }, [professionals, searchTerm, specialtyFilter]);

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .order("full_name");

      if (error) throw error;
      setProfessionals(data || []);
    } catch (error) {
      toast.error("Erro ao carregar profissionais");
    } finally {
      setLoading(false);
    }
  };

  const filterProfessionals = () => {
    let filtered = professionals;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.specialty.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (specialtyFilter !== "all") {
      filtered = filtered.filter((p) => p.specialty === specialtyFilter);
    }

    setFilteredProfessionals(filtered);
  };

  const uniqueSpecialties = Array.from(
    new Set(professionals.map((p) => p.specialty))
  );

  const handleOpenDialog = (professional?: Professional) => {
    if (professional) {
      setEditingProfessional(professional);
      setFormData({
        full_name: professional.full_name,
        specialty: professional.specialty,
        phone: professional.phone || "",
        email: professional.email || "",
      });
    } else {
      setEditingProfessional(null);
      setFormData({
        full_name: "",
        specialty: "",
        phone: "",
        email: "",
      });
    }
    setErrors({});
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProfessional(null);
    setFormData({
      full_name: "",
      specialty: "",
      phone: "",
      email: "",
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = professionalSchema.parse(formData);

      // Buscar a primeira clínica disponível
      const { data: clinicData } = await supabase
        .from("clinics")
        .select("id")
        .limit(1)
        .single();

      if (editingProfessional) {
        const { error } = await supabase
          .from("professionals")
          .update(validatedData)
          .eq("id", editingProfessional.id);

        if (error) throw error;
        toast.success("Profissional atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("professionals")
          .insert([{
            clinic_id: clinicData?.id,
            full_name: validatedData.full_name,
            specialty: validatedData.specialty,
            phone: validatedData.phone || null,
            email: validatedData.email || null,
          }]);

        if (error) throw error;
        toast.success("Profissional adicionado com sucesso");
      }

      handleCloseDialog();
      fetchProfessionals();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        toast.error("Erro ao salvar profissional");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este profissional?")) return;

    try {
      const { error } = await supabase
        .from("professionals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Profissional excluído com sucesso");
      fetchProfessionals();
    } catch (error) {
      toast.error("Erro ao excluir profissional");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Profissionais</h1>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Profissional
          </Button>
        </div>

        <Card className="p-6 mb-6 border-border">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou especialidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por especialidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as especialidades</SelectItem>
                  {uniqueSpecialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfessionals.map((professional) => (
            <Card key={professional.id} className="p-6 border-border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-card-foreground">
                    {professional.full_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {professional.specialty}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(professional)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(professional.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              {professional.phone && (
                <p className="text-sm text-muted-foreground mb-2">
                  {professional.phone}
                </p>
              )}
              {professional.email && (
                <p className="text-sm text-muted-foreground">
                  {professional.email}
                </p>
              )}
            </Card>
          ))}
        </div>

        {filteredProfessionals.length === 0 && (
          <Card className="p-12 text-center border-border">
            <p className="text-muted-foreground">
              Nenhum profissional encontrado
            </p>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProfessional ? "Editar Profissional" : "Adicionar Profissional"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do profissional
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                  />
                  {errors.full_name && (
                    <p className="text-sm text-destructive mt-1">{errors.full_name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="specialty">Especialidade *</Label>
                  <Input
                    id="specialty"
                    value={formData.specialty}
                    onChange={(e) =>
                      setFormData({ ...formData, specialty: e.target.value })
                    }
                  />
                  {errors.specialty && (
                    <p className="text-sm text-destructive mt-1">{errors.specialty}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                  )}
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProfessional ? "Atualizar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Professionals;
