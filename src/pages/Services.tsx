import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Clock, DollarSign } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  status: string;
  clinic_id: string;
}

interface Professional {
  id: string;
  full_name: string;
  specialty: string;
}

const Services = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_minutes: 30,
    price: 0,
    status: "active",
    professional_ids: [] as string[],
  });

  useEffect(() => {
    fetchServices();
    fetchProfessionals();
  }, [user]);

  const fetchServices = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar serviços",
        variant: "destructive",
      });
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const fetchProfessionals = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("professionals")
      .select("id, full_name, specialty")
      .order("full_name");

    if (error) {
      console.error("Error fetching professionals:", error);
    } else {
      setProfessionals(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      toast({
        title: "Erro",
        description: "Perfil não encontrado",
        variant: "destructive",
      });
      return;
    }

    if (editingService) {
      const { error } = await supabase
        .from("services")
        .update({
          name: formData.name,
          description: formData.description,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          status: formData.status,
        })
        .eq("id", editingService.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao atualizar serviço",
          variant: "destructive",
        });
      } else {
        // Update professional associations
        await updateProfessionalServices(editingService.id);
        
        toast({
          title: "Sucesso",
          description: "Serviço atualizado com sucesso",
        });
        setDialogOpen(false);
        fetchServices();
      }
    } else {
      const { data: serviceData, error } = await supabase
        .from("services")
        .insert({
          clinic_id: profile.clinic_id,
          name: formData.name,
          description: formData.description,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          status: formData.status,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao criar serviço",
          variant: "destructive",
        });
      } else if (serviceData) {
        // Add professional associations
        await updateProfessionalServices(serviceData.id);
        
        toast({
          title: "Sucesso",
          description: "Serviço criado com sucesso",
        });
        setDialogOpen(false);
        fetchServices();
      }
    }

    resetForm();
  };

  const updateProfessionalServices = async (serviceId: string) => {
    // Delete existing associations
    await supabase
      .from("professional_services")
      .delete()
      .eq("service_id", serviceId);

    // Add new associations
    if (formData.professional_ids.length > 0) {
      const associations = formData.professional_ids.map(professionalId => ({
        professional_id: professionalId,
        service_id: serviceId,
      }));

      await supabase
        .from("professional_services")
        .insert(associations);
    }
  };

  const handleEdit = async (service: Service) => {
    setEditingService(service);
    
    // Fetch professional associations
    const { data: associations } = await supabase
      .from("professional_services")
      .select("professional_id")
      .eq("service_id", service.id);

    setFormData({
      name: service.name,
      description: service.description || "",
      duration_minutes: service.duration_minutes,
      price: service.price,
      status: service.status,
      professional_ids: associations?.map(a => a.professional_id) || [],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return;

    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir serviço",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Serviço excluído com sucesso",
      });
      fetchServices();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      duration_minutes: 30,
      price: 0,
      status: "active",
      professional_ids: [],
    });
    setEditingService(null);
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || service.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie os serviços oferecidos pela clínica
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" /> Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Editar Serviço" : "Novo Serviço"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Serviço *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duração (minutos) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    step="5"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_minutes: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Valor (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Profissionais Habilitados</Label>
                <div className="space-y-2 mt-2 border rounded-md p-4 max-h-48 overflow-y-auto">
                  {professionals.map((prof) => (
                    <div key={prof.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={prof.id}
                        checked={formData.professional_ids.includes(prof.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              professional_ids: [
                                ...formData.professional_ids,
                                prof.id,
                              ],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              professional_ids:
                                formData.professional_ids.filter(
                                  (id) => id !== prof.id
                                ),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={prof.id} className="cursor-pointer">
                        {prof.full_name} - {prof.specialty}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingService ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Buscar serviços..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {service.description || "Sem descrição"}
                    </CardDescription>
                  </div>
                  <Badge variant={service.status === "active" ? "default" : "secondary"}>
                    {service.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{service.duration_minutes} minutos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      R${" "}
                      {service.price.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(service)}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredServices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum serviço encontrado</p>
        </div>
      )}
    </div>
  );
};

export default Services;
