import { useState } from "react";
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Receipt, 
  CreditCard, 
  BarChart3, 
  Settings,
  LogOut,
  User,
  Target,
  Wallet,
  Calculator
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

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

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Lançamentos", url: "/lancamentos", icon: TrendingDown },
  { title: "Caixa", url: "/caixa", icon: Wallet },
  { title: "Dívidas", url: "/dividas", icon: CreditCard },
  { title: "NFe", url: "/nfe", icon: FileText },
  { title: "Comprovantes", url: "/comprovantes", icon: Receipt },
  { title: "Impostos", url: "/impostos", icon: Calculator },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Metas", url: "/metas", icon: Target },
];

const userItems = [
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { role } = useUserRole();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  // Define menu permissions by role
  const menuPermissions: Record<string, string[]> = {
    admin: ["/", "/lancamentos", "/caixa", "/dividas", "/nfe", "/comprovantes", "/impostos", "/relatorios", "/metas", "/configuracoes"],
    analista: ["/", "/lancamentos", "/caixa", "/dividas", "/nfe", "/comprovantes", "/impostos", "/relatorios", "/metas"],
    caixa: ["/", "/lancamentos", "/caixa", "/comprovantes"],
    contador: ["/", "/nfe", "/impostos", "/relatorios"],
    user: ["/"], // Default fallback - apenas dashboard
  };

  const allowedRoutes = role ? (menuPermissions[role] || menuPermissions.user) : menuPermissions.user;
  const filteredNavigationItems = navigationItems.filter(item => allowedRoutes.includes(item.url));

  const isActive = (path: string) => currentPath === path;
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-sidebar-accent text-sidebar-primary font-medium" 
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} bg-gradient-sidebar border-r border-sidebar-border shadow-sidebar`}
    >
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img
            src="\finasys icon.png"
            alt="Finasys"
            className="w-8 h-8 object-contain"
          />
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">Finasys</h2>
              <p className="text-xs text-sidebar-foreground/70">Gestão Financeira</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-sidebar-foreground/70 uppercase tracking-wider px-4 mb-2">
            {!collapsed ? "Menu Principal" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="mx-2">
                    <NavLink to={item.url} end className={getNavClass}>
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === 'admin' && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-xs text-sidebar-foreground/70 uppercase tracking-wider px-4 mb-2">
              {!collapsed ? "Administração" : ""}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="mx-2">
                      <NavLink to={item.url} className={getNavClass}>
                        <item.icon className="h-5 w-5" />
                        {!collapsed && <span className="ml-3">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-sidebar-accent-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email}
              </p>
              <p className="text-xs text-sidebar-foreground/70 capitalize">
                {role || 'Carregando...'}
              </p>
            </div>
          )}
        </div>
        <SidebarMenuButton 
          onClick={signOut}
          className="w-full mx-0 text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-3">Sair</span>}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}