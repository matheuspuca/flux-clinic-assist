import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePatient } from "@/hooks/useClinicData";
import { UserPlus, Loader2 } from "lucide-react";

export function CreatePatientDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const createPatient = useCreatePatient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPatient.mutate(
      { name, phone: phone || undefined, email: email || undefined, notes: notes || undefined },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setPhone("");
          setEmail("");
          setNotes("");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar Paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nome completo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas sobre o paciente..." rows={3} />
          </div>
          <Button type="submit" className="w-full" disabled={!name || createPatient.isPending}>
            {createPatient.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Cadastrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
