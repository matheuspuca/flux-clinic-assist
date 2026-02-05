import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Wallet,
  Receipt,
  Plus,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  Download,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  PiggyBank,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";

// Types
interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  status: "paid" | "pending" | "overdue";
  patientName?: string;
  serviceId?: string;
}

interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "cash";
  balance: number;
  color: string;
}

// Categories
const incomeCategories = [
  "Consultas",
  "Procedimentos",
  "Exames",
  "Retornos",
  "Convênios",
  "Particular",
  "Outros Recebimentos"
];

const expenseCategories = [
  "Aluguel",
  "Salários",
  "Material de Consumo",
  "Equipamentos",
  "Marketing",
  "Impostos",
  "Serviços Terceiros",
  "Manutenção",
  "Água/Luz/Internet",
  "Outros Gastos"
];

const paymentMethods = [
  "Dinheiro",
  "PIX",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Transferência",
  "Boleto",
  "Convênio"
];

// Mock data
const initialAccounts: Account[] = [
  { id: "1", name: "Conta Corrente", type: "checking", balance: 45320.00, color: "#2563EB" },
  { id: "2", name: "Poupança", type: "savings", balance: 25000.00, color: "#10B981" },
  { id: "3", name: "Caixa", type: "cash", balance: 3500.00, color: "#F59E0B" }
];

const generateMockTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const today = new Date();
  
  // Generate transactions for the last 3 months
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Random number of transactions per day
    const numTransactions = Math.floor(Math.random() * 4);
    
    for (let j = 0; j < numTransactions; j++) {
      const isIncome = Math.random() > 0.35;
      
      if (isIncome) {
        transactions.push({
          id: `t-${i}-${j}`,
          type: "income",
          category: incomeCategories[Math.floor(Math.random() * incomeCategories.length)],
          description: `Atendimento paciente`,
          amount: Math.floor(Math.random() * 500 + 150),
          date: format(date, "yyyy-MM-dd"),
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          status: Math.random() > 0.1 ? "paid" : "pending",
          patientName: ["Maria Silva", "João Santos", "Ana Costa", "Pedro Lima", "Carla Oliveira"][Math.floor(Math.random() * 5)]
        });
      } else {
        transactions.push({
          id: `t-${i}-${j}`,
          type: "expense",
          category: expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
          description: expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
          amount: Math.floor(Math.random() * 2000 + 100),
          date: format(date, "yyyy-MM-dd"),
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          status: Math.random() > 0.15 ? "paid" : Math.random() > 0.5 ? "pending" : "overdue"
        });
      }
    }
  }
  
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const CHART_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

const Financial = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(generateMockTransactions());
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    type: "income" as "income" | "expense",
    category: "",
    description: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    paymentMethod: "",
    status: "pending" as "paid" | "pending" | "overdue",
    patientName: ""
  });

  // Filter transactions by selected month
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = parseISO(t.date);
    const inMonth = isWithinInterval(transactionDate, { start: monthStart, end: monthEnd });
    const matchesType = filterType === "all" || t.type === filterType;
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    return inMonth && matchesType && matchesCategory && matchesStatus;
  });

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter(t => t.type === "income" && t.status === "paid")
    .reduce((acc, t) => acc + t.amount, 0);
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === "expense" && t.status === "paid")
    .reduce((acc, t) => acc + t.amount, 0);
  
  const pendingIncome = filteredTransactions
    .filter(t => t.type === "income" && t.status === "pending")
    .reduce((acc, t) => acc + t.amount, 0);
  
  const pendingExpenses = filteredTransactions
    .filter(t => t.type === "expense" && (t.status === "pending" || t.status === "overdue"))
    .reduce((acc, t) => acc + t.amount, 0);
  
  const overdueAmount = filteredTransactions
    .filter(t => t.status === "overdue")
    .reduce((acc, t) => acc + t.amount, 0);
  
  const balance = totalIncome - totalExpenses;
  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);

  // Chart data - Daily cash flow
  const dailyCashFlow = (() => {
    const days: { [key: string]: { income: number; expense: number } } = {};
    
    filteredTransactions.forEach(t => {
      if (!days[t.date]) {
        days[t.date] = { income: 0, expense: 0 };
      }
      if (t.type === "income" && t.status === "paid") {
        days[t.date].income += t.amount;
      } else if (t.type === "expense" && t.status === "paid") {
        days[t.date].expense += t.amount;
      }
    });
    
    return Object.entries(days)
      .map(([date, values]) => ({
        date: format(parseISO(date), "dd/MM"),
        receitas: values.income,
        despesas: values.expense,
        saldo: values.income - values.expense
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-15);
  })();

  // Chart data - Expenses by category
  const expensesByCategory = (() => {
    const categories: { [key: string]: number } = {};
    
    filteredTransactions
      .filter(t => t.type === "expense" && t.status === "paid")
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  })();

  // Chart data - Income by category
  const incomeByCategory = (() => {
    const categories: { [key: string]: number } = {};
    
    filteredTransactions
      .filter(t => t.type === "income" && t.status === "paid")
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // Chart data - Monthly comparison
  const monthlyComparison = (() => {
    const months: { [key: string]: { income: number; expense: number } } = {};
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthKey = format(monthDate, "yyyy-MM");
      months[monthKey] = { income: 0, expense: 0 };
    }
    
    transactions.forEach(t => {
      const monthKey = t.date.substring(0, 7);
      if (months[monthKey]) {
        if (t.type === "income" && t.status === "paid") {
          months[monthKey].income += t.amount;
        } else if (t.type === "expense" && t.status === "paid") {
          months[monthKey].expense += t.amount;
        }
      }
    });
    
    return Object.entries(months).map(([month, values]) => ({
      month: format(parseISO(month + "-01"), "MMM", { locale: ptBR }),
      receitas: values.income,
      despesas: values.expense,
      lucro: values.income - values.expense
    }));
  })();

  // Chart data - Payment methods
  const paymentMethodsData = (() => {
    const methods: { [key: string]: number } = {};
    
    filteredTransactions
      .filter(t => t.type === "income" && t.status === "paid")
      .forEach(t => {
        methods[t.paymentMethod] = (methods[t.paymentMethod] || 0) + t.amount;
      });
    
    return Object.entries(methods)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTransaction) {
      setTransactions(transactions.map(t => 
        t.id === editingTransaction.id 
          ? { ...t, ...formData, amount: parseFloat(formData.amount) }
          : t
      ));
    } else {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        ...formData,
        amount: parseFloat(formData.amount)
      };
      setTransactions([newTransaction, ...transactions]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: "income",
      category: "",
      description: "",
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      paymentMethod: "",
      status: "pending",
      patientName: ""
    });
    setEditingTransaction(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      amount: transaction.amount.toString(),
      date: transaction.date,
      paymentMethod: transaction.paymentMethod,
      status: transaction.status,
      patientName: transaction.patientName || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Pago</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pendente</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Atrasado</Badge>;
      default:
        return null;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground">Gestão financeira completa da clínica</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedMonth}
                onSelect={(date) => date && setSelectedMonth(date)}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? "Editar Transação" : "Nova Transação"}
                </DialogTitle>
                <DialogDescription>
                  {editingTransaction ? "Atualize os dados da transação" : "Adicione uma nova receita ou despesa"}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={formData.type === "income" ? "default" : "outline"}
                    className={cn(
                      "gap-2",
                      formData.type === "income" && "bg-green-600 hover:bg-green-700"
                    )}
                    onClick={() => setFormData({ ...formData, type: "income", category: "" })}
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    Receita
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === "expense" ? "default" : "outline"}
                    className={cn(
                      "gap-2",
                      formData.type === "expense" && "bg-red-600 hover:bg-red-700"
                    )}
                    onClick={() => setFormData({ ...formData, type: "expense", category: "" })}
                  >
                    <ArrowDownCircle className="h-4 w-4" />
                    Despesa
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {(formData.type === "income" ? incomeCategories : expenseCategories).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da transação"
                  />
                </div>
                
                {formData.type === "income" && (
                  <div className="space-y-2">
                    <Label>Nome do Paciente</Label>
                    <Input
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      placeholder="Nome do paciente (opcional)"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0,00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Forma de Pagamento</Label>
                    <Select 
                      value={formData.paymentMethod} 
                      onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map(method => (
                          <SelectItem key={method} value={method}>{method}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="overdue">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingTransaction ? "Salvar" : "Adicionar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receitas (Mês)</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesas (Mês)</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro (Mês)</p>
                <p className={cn("text-2xl font-bold", balance >= 0 ? "text-green-600" : "text-red-600")}>
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center",
                balance >= 0 ? "bg-green-100" : "bg-red-100"
              )}>
                <DollarSign className={cn("h-6 w-6", balance >= 0 ? "text-green-600" : "text-red-600")} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">A Receber</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingIncome)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.map(account => (
          <Card key={account.id} className="border-l-4" style={{ borderLeftColor: account.color }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{account.name}</p>
                  <p className="text-xl font-bold">{formatCurrency(account.balance)}</p>
                </div>
                <div 
                  className="h-10 w-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: account.color + "20" }}
                >
                  {account.type === "cash" ? (
                    <Wallet className="h-5 w-5" style={{ color: account.color }} />
                  ) : account.type === "savings" ? (
                    <PiggyBank className="h-5 w-5" style={{ color: account.color }} />
                  ) : (
                    <CreditCard className="h-5 w-5" style={{ color: account.color }} />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="receivables">Contas a Receber</TabsTrigger>
          <TabsTrigger value="payables">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cash Flow Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fluxo de Caixa Diário</CardTitle>
                <CardDescription>Últimos 15 dias com movimentação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyCashFlow}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(value) => `R$${value/1000}k`} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                      />
                      <Area type="monotone" dataKey="receitas" stackId="1" stroke="#10B981" fill="#10B98140" name="Receitas" />
                      <Area type="monotone" dataKey="despesas" stackId="2" stroke="#EF4444" fill="#EF444440" name="Despesas" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparativo Mensal</CardTitle>
                <CardDescription>Últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyComparison}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(value) => `R$${value/1000}k`} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                      />
                      <Legend />
                      <Bar dataKey="receitas" fill="#10B981" name="Receitas" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesas" fill="#EF4444" name="Despesas" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Expenses by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
                <CardDescription>Distribuição de gastos do mês</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {expensesByCategory.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Formas de Pagamento</CardTitle>
                <CardDescription>Receitas por método de pagamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentMethodsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" fontSize={12} tickFormatter={(value) => `R$${value/1000}k`} />
                      <YAxis type="category" dataKey="name" fontSize={12} width={100} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Últimas Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Forma Pgto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.slice(0, 10).map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(parseISO(transaction.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        {transaction.type === "income" ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Receita</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Despesa</Badge>
                        )}
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>
                        {transaction.description}
                        {transaction.patientName && (
                          <span className="text-muted-foreground text-sm ml-2">
                            ({transaction.patientName})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{transaction.paymentMethod}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        transaction.type === "income" ? "text-green-600" : "text-red-600"
                      )}>
                        {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <CardTitle>Todas as Transações</CardTitle>
                  <CardDescription>Histórico completo de movimentações</CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="income">Receitas</SelectItem>
                      <SelectItem value="expense">Despesas</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="overdue">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Forma Pgto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(parseISO(transaction.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        {transaction.type === "income" ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Receita</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Despesa</Badge>
                        )}
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell>
                        {transaction.description}
                        {transaction.patientName && (
                          <span className="text-muted-foreground text-sm ml-2">
                            ({transaction.patientName})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{transaction.paymentMethod}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        transaction.type === "income" ? "text-green-600" : "text-red-600"
                      )}>
                        {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(transaction.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receivables Tab */}
        <TabsContent value="receivables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Receber</CardTitle>
              <CardDescription>Receitas pendentes de recebimento</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions
                    .filter(t => t.type === "income" && t.status !== "paid")
                    .slice(0, 20)
                    .map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(parseISO(transaction.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{transaction.patientName || "-"}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setTransactions(transactions.map(t =>
                                t.id === transaction.id ? { ...t, status: "paid" } : t
                              ));
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Receber
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              
              <div className="mt-4 p-4 bg-muted rounded-lg flex justify-between items-center">
                <span className="font-medium">Total a Receber</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(
                    transactions
                      .filter(t => t.type === "income" && t.status !== "paid")
                      .reduce((acc, t) => acc + t.amount, 0)
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payables Tab */}
        <TabsContent value="payables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>Despesas pendentes de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Forma Pgto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions
                    .filter(t => t.type === "expense" && t.status !== "paid")
                    .slice(0, 20)
                    .map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell>{format(parseISO(transaction.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.paymentMethod}</TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setTransactions(transactions.map(t =>
                                t.id === transaction.id ? { ...t, status: "paid" } : t
                              ));
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Pagar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              
              <div className="mt-4 p-4 bg-muted rounded-lg flex justify-between items-center">
                <span className="font-medium">Total a Pagar</span>
                <span className="text-xl font-bold text-red-600">
                  {formatCurrency(
                    transactions
                      .filter(t => t.type === "expense" && t.status !== "paid")
                      .reduce((acc, t) => acc + t.amount, 0)
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Receitas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeByCategory}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {incomeByCategory.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Evolução do Lucro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyComparison}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(value) => `R$${value/1000}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Line 
                        type="monotone" 
                        dataKey="lucro" 
                        stroke="#2563EB" 
                        strokeWidth={2}
                        dot={{ fill: "#2563EB", strokeWidth: 2 }}
                        name="Lucro"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-sm text-green-600">Total Receitas (Mês)</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(totalIncome)}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <p className="text-sm text-red-600">Total Despesas (Mês)</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(totalExpenses)}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-blue-600">Lucro Líquido (Mês)</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(balance)}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <p className="text-sm text-yellow-600">Margem de Lucro</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0}%
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Financial;
