import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/hooks/useAuth";

const AdminLayout = () => {
  const { user, isReady, isAdmin } = useAuth();

  useEffect(() => {
    document.documentElement.classList.add("admin-theme", "dark");
    return () => document.documentElement.classList.remove("admin-theme", "dark");
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-center px-6">
        <div className="space-y-2">
          <p className="text-lg font-semibold">Acesso negado</p>
          <p className="text-sm text-muted-foreground">Sua conta não tem permissão de administrador.</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b border-border/60 bg-background/60 backdrop-blur sticky top-0 z-30">
            <SidebarTrigger className="ml-2" />
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;