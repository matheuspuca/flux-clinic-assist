import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Search, AlertTriangle, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Calendar, Edit, Trash2, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import { format, addDays, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  costPrice: number;
  expirationDate: string | null;
  supplier: string;
  location: string;
  status: "normal" | "low" | "critical" | "expired";
}

interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: "entry" | "exit";
  quantity: number;
  reason: string;
  date: string;
  responsible: string;
  notes: string;
}

const categories = [
  "Medicamentos",
  "Material Descartável",
  "EPIs",
  "Material de Limpeza",
  "Insumos Médicos",
  "Equipamentos",
  "Material de Escritório"
];

const units = ["Unidade", "Caixa", "Pacote", "Frasco", "Litro", "Kg", "Par", "Rolo"];

const initialProducts: Product[] = [
  { id: "1", name: "Luvas de Procedimento M", category: "EPIs", unit: "Caixa", currentStock: 45, minStock: 20, maxStock: 100, costPrice: 35.90, expirationDate: "2025-06-15", supplier: "MedSupply", location: "Armário 1", status: "normal" },
  { id: "2", name: "Álcool 70%", category: "Material de Limpeza", unit: "Litro", currentStock: 8, minStock: 10, maxStock: 50, costPrice: 12.50, expirationDate: "2026-01-20", supplier: "CleanPro", location: "Depósito", status: "low" },
  { id: "3", name: "Seringa 5ml", category: "Material Descartável", unit: "Caixa", currentStock: 3, minStock: 15, maxStock: 60, costPrice: 45.00, expirationDate: "2025-08-30", supplier: "MedSupply", location: "Armário 2", status: "critical" },
  { id: "4", name: "Dipirona 500mg", category: "Medicamentos", unit: "Caixa", currentStock: 25, minStock: 10, maxStock: 50, costPrice: 18.90, expirationDate: "2025-03-10", supplier: "FarmaDist", location: "Farmácia", status: "expired" },
  { id: "5", name: "Gaze Estéril", category: "Material Descartável", unit: "Pacote", currentStock: 80, minStock: 30, maxStock: 150, costPrice: 8.50, expirationDate: "2026-12-01", supplier: "MedSupply", location: "Armário 1", status: "normal" },
  { id: "6", name: "Esparadrapo", category: "Material Descartável", unit: "Rolo", currentStock: 22, minStock: 15, maxStock: 40, costPrice: 15.00, expirationDate: "2027-05-20", supplier: "MedSupply", location: "Armário 1", status: "normal" },
  { id: "7", name: "Máscara Cirúrgica", category: "EPIs", unit: "Caixa", currentStock: 12, minStock: 20, maxStock: 80, costPrice: 28.00, expirationDate: "2025-09-15", supplier: "SafetyMed", location: "Armário 1", status: "low" },
  { id: "8", name: "Agulha 25x7", category: "Material Descartável", unit: "Caixa", currentStock: 40, minStock: 25, maxStock: 100, costPrice: 32.00, expirationDate: "2026-04-10", supplier: "MedSupply", location: "Armário 2", status: "normal" },
];

const initialMovements: StockMovement[] = [
  { id: "1", productId: "1", productName: "Luvas de Procedimento M", type: "entry", quantity: 20, reason: "Compra", date: "2025-01-28", responsible: "Maria Silva", notes: "NF 12345" },
  { id: "2", productId: "3", productName: "Seringa 5ml", type: "exit", quantity: 5, reason: "Uso em procedimento", date: "2025-01-28", responsible: "Dr. João Santos", notes: "" },
  { id: "3", productId: "2", productName: "Álcool 70%", type: "exit", quantity: 3, reason: "Uso diário", date: "2025-01-27", responsible: "Equipe Limpeza", notes: "" },
  { id: "4", productId: "5", productName: "Gaze Estéril", type: "entry", quantity: 50, reason: "Compra", date: "2025-01-26", responsible: "Maria Silva", notes: "NF 12340" },
  { id: "5", productId: "7", productName: "Máscara Cirúrgica", type: "exit", quantity: 8, reason: "Distribuição", date: "2025-01-25", responsible: "Maria Silva", notes: "Entrega para equipe" },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

const Inventory = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [movements, setMovements] = useState<StockMovement[]>(initialMovements);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<"entry" | "exit">("entry");

  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    unit: "",
    currentStock: "",
    minStock: "",
    maxStock: "",
    costPrice: "",
    expirationDate: "",
    supplier: "",
    location: ""
  });

  const [movementForm, setMovementForm] = useState({
    productId: "",
    quantity: "",
    reason: "",
    responsible: "",
    notes: ""
  });

  const getProductStatus = (product: Product): "normal" | "low" | "critical" | "expired" => {
    if (product.expirationDate && isBefore(parseISO(product.expirationDate), new Date())) {
      return "expired";
    }
    if (product.currentStock <= product.minStock * 0.5) return "critical";
    if (product.currentStock <= product.minStock) return "low";
    return "normal";
  };

  const updateProductStatuses = (prods: Product[]) => {
    return prods.map(p => ({ ...p, status: getProductStatus(p) }));
  };

  const filteredProducts = updateProductStatuses(products).filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockProducts = updateProductStatuses(products).filter(p => p.status === "low" || p.status === "critical");
  const expiringProducts = products.filter(p => {
    if (!p.expirationDate) return false;
    const expDate = parseISO(p.expirationDate);
    const thirtyDaysFromNow = addDays(new Date(), 30);
    return isBefore(expDate, thirtyDaysFromNow) && isAfter(expDate, new Date());
  });
  const expiredProducts = updateProductStatuses(products).filter(p => p.status === "expired");

  const totalValue = products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0);
  const totalItems = products.reduce((acc, p) => acc + p.currentStock, 0);

  const handleSaveProduct = () => {
    if (!productForm.name || !productForm.category || !productForm.unit) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    const productData: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: productForm.name,
      category: productForm.category,
      unit: productForm.unit,
      currentStock: Number(productForm.currentStock) || 0,
      minStock: Number(productForm.minStock) || 0,
      maxStock: Number(productForm.maxStock) || 0,
      costPrice: Number(productForm.costPrice) || 0,
      expirationDate: productForm.expirationDate || null,
      supplier: productForm.supplier,
      location: productForm.location,
      status: "normal"
    };

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? productData : p));
      toast({ title: "Sucesso", description: "Produto atualizado com sucesso" });
    } else {
      setProducts([...products, productData]);
      toast({ title: "Sucesso", description: "Produto cadastrado com sucesso" });
    }

    setIsProductDialogOpen(false);
    resetProductForm();
  };

  const handleSaveMovement = () => {
    if (!movementForm.productId || !movementForm.quantity || !movementForm.reason) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    const product = products.find(p => p.id === movementForm.productId);
    if (!product) return;

    const quantity = Number(movementForm.quantity);

    if (movementType === "exit" && quantity > product.currentStock) {
      toast({ title: "Erro", description: "Quantidade insuficiente em estoque", variant: "destructive" });
      return;
    }

    const movement: StockMovement = {
      id: Date.now().toString(),
      productId: movementForm.productId,
      productName: product.name,
      type: movementType,
      quantity,
      reason: movementForm.reason,
      date: format(new Date(), "yyyy-MM-dd"),
      responsible: movementForm.responsible,
      notes: movementForm.notes
    };

    setMovements([movement, ...movements]);
    setProducts(products.map(p => {
      if (p.id === movementForm.productId) {
        return {
          ...p,
          currentStock: movementType === "entry" 
            ? p.currentStock + quantity 
            : p.currentStock - quantity
        };
      }
      return p;
    }));

    toast({ 
      title: "Sucesso", 
      description: `${movementType === "entry" ? "Entrada" : "Saída"} registrada com sucesso` 
    });
    setIsMovementDialogOpen(false);
    resetMovementForm();
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      currentStock: product.currentStock.toString(),
      minStock: product.minStock.toString(),
      maxStock: product.maxStock.toString(),
      costPrice: product.costPrice.toString(),
      expirationDate: product.expirationDate || "",
      supplier: product.supplier,
      location: product.location
    });
    setIsProductDialogOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast({ title: "Sucesso", description: "Produto removido com sucesso" });
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProductForm({
      name: "", category: "", unit: "", currentStock: "", minStock: "",
      maxStock: "", costPrice: "", expirationDate: "", supplier: "", location: ""
    });
  };

  const resetMovementForm = () => {
    setMovementForm({ productId: "", quantity: "", reason: "", responsible: "", notes: "" });
  };

  const openMovementDialog = (type: "entry" | "exit") => {
    setMovementType(type);
    resetMovementForm();
    setIsMovementDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      normal: { label: "Normal", className: "bg-green-100 text-green-700 border-green-200" },
      low: { label: "Baixo", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      critical: { label: "Crítico", className: "bg-red-100 text-red-700 border-red-200" },
      expired: { label: "Vencido", className: "bg-gray-100 text-gray-700 border-gray-200" }
    };
    const v = variants[status] || variants.normal;
    return <Badge className={v.className}>{v.label}</Badge>;
  };

  // Chart data
  const categoryData = categories.map(cat => ({
    name: cat,
    value: products.filter(p => p.category === cat).reduce((acc, p) => acc + p.currentStock, 0)
  })).filter(c => c.value > 0);

  const movementChartData = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), -6 + i);
    const dateStr = format(date, "yyyy-MM-dd");
    const entries = movements.filter(m => m.date === dateStr && m.type === "entry").reduce((acc, m) => acc + m.quantity, 0);
    const exits = movements.filter(m => m.date === dateStr && m.type === "exit").reduce((acc, m) => acc + m.quantity, 0);
    return {
      date: format(date, "dd/MM", { locale: ptBR }),
      entradas: entries,
      saidas: exits
    };
  });

  const stockValueByCategory = categories.map(cat => ({
    name: cat.length > 12 ? cat.substring(0, 12) + "..." : cat,
    valor: products.filter(p => p.category === cat).reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0)
  })).filter(c => c.valor > 0);

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Controle de Estoque</h1>
          <p className="text-muted-foreground">Gerencie produtos, movimentações e alertas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openMovementDialog("exit")} className="gap-2">
            <ArrowDownCircle className="h-4 w-4 text-red-500" />
            Saída
          </Button>
          <Button variant="outline" onClick={() => openMovementDialog("entry")} className="gap-2">
            <ArrowUpCircle className="h-4 w-4 text-green-500" />
            Entrada
          </Button>
          <Dialog open={isProductDialogOpen} onOpenChange={(open) => { setIsProductDialogOpen(open); if (!open) resetProductForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
                <DialogDescription>Preencha as informações do produto</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="col-span-2">
                  <Label>Nome do Produto *</Label>
                  <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="Ex: Luvas de Procedimento" />
                </div>
                <div>
                  <Label>Categoria *</Label>
                  <Select value={productForm.category} onValueChange={(value) => setProductForm({ ...productForm, category: value })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unidade *</Label>
                  <Select value={productForm.unit} onValueChange={(value) => setProductForm({ ...productForm, unit: value })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estoque Atual</Label>
                  <Input type="number" value={productForm.currentStock} onChange={(e) => setProductForm({ ...productForm, currentStock: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <Label>Estoque Mínimo</Label>
                  <Input type="number" value={productForm.minStock} onChange={(e) => setProductForm({ ...productForm, minStock: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <Label>Estoque Máximo</Label>
                  <Input type="number" value={productForm.maxStock} onChange={(e) => setProductForm({ ...productForm, maxStock: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <Label>Preço de Custo (R$)</Label>
                  <Input type="number" step="0.01" value={productForm.costPrice} onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })} placeholder="0,00" />
                </div>
                <div>
                  <Label>Data de Validade</Label>
                  <Input type="date" value={productForm.expirationDate} onChange={(e) => setProductForm({ ...productForm, expirationDate: e.target.value })} />
                </div>
                <div>
                  <Label>Fornecedor</Label>
                  <Input value={productForm.supplier} onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })} placeholder="Nome do fornecedor" />
                </div>
                <div>
                  <Label>Localização</Label>
                  <Input value={productForm.location} onChange={(e) => setProductForm({ ...productForm, location: e.target.value })} placeholder="Ex: Armário 1" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveProduct}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardDescription>Total de Itens</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {totalItems.toLocaleString('pt-BR')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{products.length} produtos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardDescription>Valor em Estoque</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Custo total dos produtos</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardDescription>Estoque Baixo</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {lowStockProducts.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Produtos precisam reposição</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardDescription>Vencidos/Vencendo</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-500" />
              {expiredProducts.length + expiringProducts.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{expiredProducts.length} vencidos, {expiringProducts.length} vencendo em 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(lowStockProducts.length > 0 || expiredProducts.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {lowStockProducts.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-yellow-700">
                  <AlertTriangle className="h-5 w-5" />
                  Alerta de Estoque Baixo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 3).map(p => (
                    <div key={p.id} className="flex justify-between items-center text-sm">
                      <span>{p.name}</span>
                      <span className="font-medium">{p.currentStock} {p.unit.toLowerCase()}(s)</span>
                    </div>
                  ))}
                  {lowStockProducts.length > 3 && (
                    <p className="text-xs text-muted-foreground">E mais {lowStockProducts.length - 3} produtos...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {expiredProducts.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                  <Calendar className="h-5 w-5" />
                  Produtos Vencidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiredProducts.slice(0, 3).map(p => (
                    <div key={p.id} className="flex justify-between items-center text-sm">
                      <span>{p.name}</span>
                      <span className="font-medium text-red-600">
                        {p.expirationDate ? format(parseISO(p.expirationDate), "dd/MM/yyyy") : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Movimentações (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={movementChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="entradas" stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.6} name="Entradas" />
                <Area type="monotone" dataKey="saidas" stackId="2" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.6} name="Saídas" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estoque por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Valor por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stockValueByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={10} tickFormatter={(v) => `R$${v}`} />
                <YAxis type="category" dataKey="name" fontSize={10} width={80} />
                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Movimentações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar produtos..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Baixo</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                    <SelectItem value="expired">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-center">Estoque</TableHead>
                    <TableHead className="text-center">Mín/Máx</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Custo Unit.</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.supplier}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {product.currentStock} {product.unit.toLowerCase()}(s)
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground text-sm">
                        {product.minStock} / {product.maxStock}
                      </TableCell>
                      <TableCell>
                        {product.expirationDate ? format(parseISO(product.expirationDate), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell className="text-right">
                        R$ {product.costPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
              <CardDescription>Entradas e saídas de produtos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell>{format(parseISO(mov.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={mov.type === "entry" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {mov.type === "entry" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {mov.type === "entry" ? "Entrada" : "Saída"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{mov.productName}</TableCell>
                      <TableCell className="text-center">{mov.quantity}</TableCell>
                      <TableCell>{mov.reason}</TableCell>
                      <TableCell>{mov.responsible}</TableCell>
                      <TableCell className="text-muted-foreground">{mov.notes || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Movement Dialog */}
      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {movementType === "entry" ? (
                <><ArrowUpCircle className="h-5 w-5 text-green-500" /> Registrar Entrada</>
              ) : (
                <><ArrowDownCircle className="h-5 w-5 text-red-500" /> Registrar Saída</>
              )}
            </DialogTitle>
            <DialogDescription>
              {movementType === "entry" ? "Adicione itens ao estoque" : "Retire itens do estoque"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Produto *</Label>
              <Select value={movementForm.productId} onValueChange={(value) => setMovementForm({ ...movementForm, productId: value })}>
                <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (Estoque: {p.currentStock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade *</Label>
              <Input type="number" value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} placeholder="0" />
            </div>
            <div>
              <Label>Motivo *</Label>
              <Select value={movementForm.reason} onValueChange={(value) => setMovementForm({ ...movementForm, reason: value })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {movementType === "entry" ? (
                    <>
                      <SelectItem value="Compra">Compra</SelectItem>
                      <SelectItem value="Doação">Doação</SelectItem>
                      <SelectItem value="Devolução">Devolução</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                      <SelectItem value="Ajuste de inventário">Ajuste de inventário</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Uso em procedimento">Uso em procedimento</SelectItem>
                      <SelectItem value="Uso diário">Uso diário</SelectItem>
                      <SelectItem value="Distribuição">Distribuição</SelectItem>
                      <SelectItem value="Descarte">Descarte</SelectItem>
                      <SelectItem value="Perda/Avaria">Perda/Avaria</SelectItem>
                      <SelectItem value="Vencimento">Vencimento</SelectItem>
                      <SelectItem value="Ajuste de inventário">Ajuste de inventário</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável</Label>
              <Input value={movementForm.responsible} onChange={(e) => setMovementForm({ ...movementForm, responsible: e.target.value })} placeholder="Nome do responsável" />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={movementForm.notes} onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })} placeholder="Notas adicionais (NF, lote, etc.)" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMovementDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveMovement} className={movementType === "entry" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
              Confirmar {movementType === "entry" ? "Entrada" : "Saída"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
