import { useState } from "react";
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

// Dados mock iniciais
const initialProfessionals: Professional[] = [
  { id: "1", full_name: "Dr. Carlos Silva", specialty: "Clínico Geral", phone: "(11) 99999-0001", email: "carlos@clinica.com" },
  { id: "2", full_name: "Dra. Ana Santos", specialty: "Dermatologia", phone: "(11) 99999-0002", email: "ana@clinica.com" },
  { id: "3", full_name: "Dr. Pedro Costa", specialty: "Cardiologia", phone: "(11) 99999-0003", email: "pedro@clinica.com" },
];

const Professionals = () => {
  const [professionals, setProfessionals] = useState<Professional[]>(initialProfessionals);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>(initialProfessionals);
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

  const filterProfessionals = (profs: Professional[], search: string, specialty: string) => {
    let filtered = profs;

    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.full_name.toLowerCase().includes(search.toLowerCase()) ||
          p.specialty.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (specialty !== "all") {
      filtered = filtered.filter((p) => p.specialty === specialty);
    }

    setFilteredProfessionals(filtered);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    filterProfessionals(professionals, value, specialtyFilter);
  };

  const handleSpecialtyFilterChange = (value: string) => {
    setSpecialtyFilter(value);
    filterProfessionals(professionals, searchTerm, value);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = professionalSchema.parse(formData);

      if (editingProfessional) {
        const updatedProfessionals = professionals.map(p => 
          p.id === editingProfessional.id 
            ? { ...p, ...validatedData }
            : p
        );
        setProfessionals(updatedProfessionals);
        filterProfessionals(updatedProfessionals, searchTerm, specialtyFilter);
        toast.success("Profissional atualizado com sucesso");
      } else {
        const newProfessional: Professional = {
          id: Date.now().toString(),
          full_name: validatedData.full_name,
          specialty: validatedData.specialty,
          phone: validatedData.phone || undefined,
          email: validatedData.email || undefined,
        };
        const updatedProfessionals = [...professionals, newProfessional];
        setProfessionals(updatedProfessionals);
        filterProfessionals(updatedProfessionals, searchTerm, specialtyFilter);
        toast.success("Profissional adicionado com sucesso");
      }

      handleCloseDialog();
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

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este profissional?")) return;

    const updatedProfessionals = professionals.filter(p => p.id !== id);
    setProfessionals(updatedProfessionals);
    filterProfessionals(updatedProfessionals, searchTerm, specialtyFilter);
    toast.success("Profissional excluído com sucesso");
  };

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
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-64">
              <Select value={specialtyFilter} onValueChange={handleSpecialtyFilterChange}>
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
