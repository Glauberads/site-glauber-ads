import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense, lazy } from "react";
import { motion } from "framer-motion";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AuthProvider } from "./hooks/useAuth";
import { SettingsProvider } from "./contexts/SettingsContext";

// Lazy Loading para o painel administrativo (Code Splitting)
const Login = lazy(() => import("./pages/admin/Login.tsx"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard.tsx"));
const Leads = lazy(() => import("./pages/admin/Leads.tsx"));
const Integrations = lazy(() => import("./pages/admin/Integrations.tsx"));
const Marketing = lazy(() => import("./pages/admin/Marketing.tsx"));
const Personalization = lazy(() => import("./pages/admin/Personalization"));
const AIChatLeads = lazy(() => import("./pages/admin/AIChatLeads"));
const AIQuickResponses = lazy(() => import("./pages/admin/AIQuickResponses"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SettingsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              
              <Route path="/admin/*" element={
                <Suspense fallback={<div className="h-screen w-full flex items-center justify-center text-muted-foreground">Carregando painel administrativo...</div>}>
                  <Routes>
                    <Route path="login" element={<Login />} />
                    <Route element={<AdminLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="leads" element={<Leads />} />
                      <Route path="integrations" element={<Integrations />} />
                      <Route path="marketing" element={<Marketing />} />
                      <Route path="personalizacao" element={<Personalization />} />
                      <Route path="ai-chats" element={<AIChatLeads />} />
                      <Route path="ai-quick-responses" element={<AIQuickResponses />} />
                    </Route>
                  </Routes>
                </Suspense>
              } />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </SettingsProvider>
  </QueryClientProvider>
);

export default App;
