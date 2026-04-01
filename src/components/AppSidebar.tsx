import { useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Users2, Briefcase, Calendar, DollarSign, Package, MessageSquare, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
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

  const menuItems: MenuItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, visible: true },
    { title: "Profissionais", url: "/professionals", icon: Users, visible: permissions.canManageProfessionals },
    { title: "Serviços", url: "/services", icon: Briefcase, visible: permissions.canManageServices },
    { title: "Agendamentos", url: "/appointments", icon: Calendar, visible: true },
    { title: "Estoque", url: "/inventory", icon: Package, visible: permissions.canViewInventory },
    { title: "Financeiro", url: "/financial", icon: DollarSign, visible: permissions.canViewFinancial },
    { title: "Usuários", url: "/users", icon: Users2, visible: permissions.canManageUsers },
    { title: "Chatbot Logs", url: "/chatbot-logs", icon: MessageSquare, visible: permissions.isAdmin },
    { title: "Configurações", url: "/settings", icon: Settings, visible: permissions.canManageClinicSettings },
  ];

  const visibleItems = menuItems.filter((item) => item.visible);

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
              {visibleItems.map((item) => (
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
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
