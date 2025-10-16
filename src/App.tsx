import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Lancamentos from "./pages/Lancamentos";
import Caixa from "./pages/Caixa";
import Dividas from "./pages/Dividas";
import NFe from "./pages/NFe";
import Comprovantes from "./pages/Comprovantes";
import Relatorios from "./pages/Relatorios";
import Metas from "./pages/Metas";
import Impostos from "./pages/Impostos";
import Settings from "./pages/Settings";
import ConfirmEmails from "./pages/ConfirmEmails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/lancamentos" element={
              <ProtectedRoute>
                <AppLayout>
                  <Lancamentos />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/caixa" element={
              <ProtectedRoute>
                <AppLayout>
                  <Caixa />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/dividas" element={
              <ProtectedRoute>
                <AppLayout>
                  <Dividas />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/nfe" element={
              <ProtectedRoute>
                <AppLayout>
                  <NFe />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/comprovantes" element={
              <ProtectedRoute>
                <AppLayout>
                  <Comprovantes />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
              <ProtectedRoute>
                <AppLayout>
                  <Relatorios />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/metas" element={
              <ProtectedRoute>
                <AppLayout>
                  <Metas />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/impostos" element={
              <ProtectedRoute>
                <AppLayout>
                  <Impostos />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/confirmar-emails" element={
              <ProtectedRoute>
                <AppLayout>
                  <ConfirmEmails />
                </AppLayout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
