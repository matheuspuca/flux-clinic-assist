import { useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Users2, UserCheck, Briefcase, Calendar, DollarSign, Package, MessageSquare, Settings, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { usePermissions } from "@/hooks/usePermissions";
import fluxiaLogo from "@/assets/fluxia-logo.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  visible: boolean;
};

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const permissions = usePermissions();

  const isActive = (path: string) => currentPath === path;

  const mainItems: MenuItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, visible: true },
    { title: "Agendamentos", url: "/appointments", icon: Calendar, visible: true },
    { title: "Pacientes", url: "/patients", icon: UserCheck, visible: permissions.canViewPatients },
    { title: "Profissionais", url: "/professionals", icon: Users, visible: permissions.canManageProfessionals },
    { title: "Serviços", url: "/services", icon: Briefcase, visible: permissions.canManageServices },
    { title: "Estoque", url: "/inventory", icon: Package, visible: permissions.canViewInventory },
    { title: "Financeiro", url: "/financial", icon: DollarSign, visible: permissions.canViewFinancial },
    { title: "Chatbot Logs", url: "/chatbot-logs", icon: MessageSquare, visible: permissions.isAdmin },
  ];

  const adminItems: MenuItem[] = [
    { title: "Usuários", url: "/users", icon: Users2, visible: permissions.canManageUsers },
    { title: "Configurações", url: "/settings", icon: Settings, visible: permissions.canManageClinicSettings },
  ];

  const userItems: MenuItem[] = [
    { title: "Meu Perfil", url: "/profile", icon: User, visible: true },
  ];

  const renderItems = (items: MenuItem[]) =>
    items.filter((i) => i.visible).map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end
            className="hover:bg-sidebar-accent"
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          >
            <item.icon className="mr-2 h-4 w-4" />
            {open && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  const visibleAdmin = adminItems.filter((i) => i.visible);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {open && (
          <img src={fluxiaLogo} alt="FluxIA" className="w-full h-auto" />
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderItems(mainItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleAdmin.length > 0 && (
          <>
            {open && <Separator className="mx-4 my-1" />}
            <SidebarGroup>
              <SidebarGroupLabel>Administração</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {renderItems(adminItems)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {open && <Separator className="mx-4 my-1" />}
        <SidebarGroup>
          <SidebarGroupLabel>Conta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderItems(userItems)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2" />
    </Sidebar>
  );
}
