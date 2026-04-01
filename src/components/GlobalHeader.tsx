import { useLocation, useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Search, Bell, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCommandPalette } from "@/components/CommandPalette";
import { useNotifications } from "@/hooks/useNotifications";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/appointments": "Agendamentos",
  "/patients": "Pacientes",
  "/professionals": "Profissionais",
  "/services": "Serviços",
  "/financial": "Financeiro",
  "/inventory": "Estoque",
  "/users": "Usuários",
  "/chatbot-logs": "Chatbot Logs",
  "/settings": "Configurações",
  "/profile": "Meu Perfil",
};

export function GlobalHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { open: openCommand } = useCommandPalette();
  const { notifications, unreadCount, markAllRead } = useNotifications();

  const currentLabel = routeLabels[location.pathname] || "Página";
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="h-14 md:h-12 flex items-center border-b border-border bg-background px-4 sticky top-0 z-40 gap-2">
      <SidebarTrigger />

      {/* Breadcrumb */}
      <Breadcrumb className="ml-2 hidden sm:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>
              Início
            </BreadcrumbLink>
          </BreadcrumbItem>
          {location.pathname !== "/dashboard" && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1" />

      {/* Search */}
      <Button
        variant="outline"
        size="sm"
        className="hidden sm:flex items-center gap-2 text-muted-foreground h-8 px-3"
        onClick={openCommand}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">Buscar...</span>
        <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground hidden lg:inline-flex">
          ⌘K
        </kbd>
      </Button>
      <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8" onClick={openCommand}>
        <Search className="h-4 w-4" />
      </Button>

      {/* Notifications */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-8 w-8">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <p className="text-sm font-semibold">Notificações</p>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-6" onClick={markAllRead}>
                Marcar como lidas
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-72">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sem notificações</p>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <div key={n.id} className={`p-3 text-sm ${n.read ? "" : "bg-muted/50"}`}>
                    <p className="font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(n.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <ThemeToggle />

      {/* User Avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{profile?.full_name}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <User className="mr-2 h-4 w-4" /> Meu Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" /> Configurações
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
