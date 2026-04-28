import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Megaphone, Users, Webhook, Palette } from "lucide-react";
import logoImg from "@/assets/glauber-ads-logo.png";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Gestão de Leads", url: "/admin/leads", icon: Users, end: false },
  { title: "Integrações", url: "/admin/integrations", icon: Webhook, end: false },
  { title: "Marketing & Tracking", url: "/admin/marketing", icon: Megaphone, end: false },
  { title: "Personalização", url: "/admin/personalizacao", icon: Palette, end: false },
];

export const AdminSidebar = () => {
  const { signOut, user } = useAuth();
  const { settings } = useSettings();
  const [sidebarLogoUrl, setSidebarLogoUrl] = useState<string>(logoImg);

  useEffect(() => {
    const savedLogo = settings?.logo_url;
    if (!savedLogo) {
      setSidebarLogoUrl(logoImg);
      return;
    }

    if (/^https?:\/\//i.test(savedLogo)) {
      setSidebarLogoUrl(savedLogo);
      return;
    }

    const normalizedPath = savedLogo.replace(/^\/+/g, "").replace(/^site-assets\//, "").replace(/^\/site-assets\//, "");
    const { data, error } = supabase.storage.from("site-assets").getPublicUrl(normalizedPath);
    if (!error && data?.publicUrl) {
      setSidebarLogoUrl(data.publicUrl);
      return;
    }

    setSidebarLogoUrl(logoImg);
  }, [settings?.logo_url]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/40 bg-primary/10 glow-orange overflow-hidden">
            <img
              src={sidebarLogoUrl}
              alt="Glauber Ads"
              className="h-8 w-8 object-contain"
              onError={() => {
                if (sidebarLogoUrl !== logoImg) {
                  setSidebarLogoUrl(logoImg);
                }
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">Glauber Ads</span>
            <span className="text-xs text-muted-foreground">Admin Panel</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="px-2 pb-2 text-xs text-muted-foreground truncate">{user?.email}</div>
        <Button variant="ghost" size="sm" onClick={signOut} className="justify-start gap-2">
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};