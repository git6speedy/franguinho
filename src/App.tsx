import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar"; // Importando o novo Sidebar
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext"; // Importando SidebarProvider e useSidebar
import Dashboard from "./pages/Dashboard";
import PDV from "./pages/PDV";
import OrderPanel from "./pages/OrderPanel";
import Loyalty from "./pages/Loyalty";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Products from "./pages/Products";
import Stores from "./pages/Stores";
import Stock from "./pages/Stock";
import MyStore from "./pages/MyStore";
import CustomerStore from "./pages/CustomerStore";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Totem from "./pages/Totem";
import Setup from "./pages/Setup";
import InitAdmin from "./pages/InitAdmin";
import AutoSetup from "./pages/AutoSetup";
import Home from "./pages/Home";
import Marketing from "./pages/Marketing";
import Monitor from "./pages/Monitor"; // Importando Monitor
import SubscriptionsPage from "./pages/Subscriptions"; // NOVO: Importando a página de Assinaturas
import Tasks from "./pages/Tasks"; // NOVO: Importando a página de Tarefas
import Registrations from "./pages/Registrations"; // NOVO: Importando a página de Cadastros
import Financas from "./pages/Financas"; // NOVO: Importando a página de Finanças
import Caixas from "./pages/Caixas"; // NOVO: Importando a página de Caixas
import RH from "./pages/RH";
import WhatsApp from "./pages/WhatsApp";
import AllOrders from "./pages/AllOrders";
import WhatsAppCampaigns from "./pages/WhatsAppCampaigns";
import Coupons from "./pages/Coupons";
import Insights from "./pages/Insights";
import { cn } from "@/lib/utils";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { isCollapsed } = useSidebar(); // Usando o estado do sidebar

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  const isCustomerStore = location.pathname.startsWith('/loja') && !location.pathname.startsWith('/lojas');
  const isTotem = location.pathname.startsWith('/totem');
  const isSetupPage = location.pathname.startsWith('/setup');
  const isInitAdmin = location.pathname.startsWith('/init-admin');
  const isAutoSetup = location.pathname.startsWith('/auto-setup');
  const isMonitorPage = location.pathname.startsWith('/monitor');

  const showSidebar = user && !isCustomerStore && !isTotem && !isSetupPage && !isInitAdmin && !isAutoSetup && !isMonitorPage;

  return (
    <div className="flex min-h-screen bg-background">
      {showSidebar && <Sidebar />} {/* Renderiza o novo Sidebar */}
      <main
        className={cn(
          "flex-1 w-full max-w-full transition-all duration-300",
          showSidebar && (isCollapsed ? 'ml-20' : 'ml-64'), // Ajusta a margem dinamicamente
          !isCustomerStore && !isTotem && !isMonitorPage && "p-6" // Padding apenas para páginas internas
        )}
      >
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/loja" element={<CustomerStore />} />
          <Route path="/loja/:slug" element={<CustomerStore />} />
          <Route path="/totem" element={<Totem />} />
          <Route path="/totem/:slug" element={<Totem />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/monitor/:slug" element={<Monitor />} />

          {/* Rotas Protegidas */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/pdv" element={<ProtectedRoute><PDV /></ProtectedRoute>} />
          <Route path="/painel" element={<ProtectedRoute><OrderPanel /></ProtectedRoute>} />
          <Route path="/painel/todos" element={<ProtectedRoute><AllOrders /></ProtectedRoute>} />
          <Route path="/fidelidade" element={<ProtectedRoute><Loyalty /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/produtos" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/estoque" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
          <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
          <Route path="/marketing/campanhas" element={<ProtectedRoute><WhatsAppCampaigns /></ProtectedRoute>} />
          <Route path="/marketing/cupons" element={<ProtectedRoute><Coupons /></ProtectedRoute>} />
          <Route path="/marketing/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
          <Route path="/minha-loja" element={<ProtectedRoute><MyStore /></ProtectedRoute>} />
          <Route path="/lojas" element={<ProtectedRoute><Stores /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/assinaturas" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} /> {/* NOVO: Rota para Assinaturas */}
          <Route path="/tarefas" element={<ProtectedRoute><Tasks /></ProtectedRoute>} /> {/* NOVO: Rota para Tarefas */}
          <Route path="/cadastros" element={<ProtectedRoute><Registrations /></ProtectedRoute>} /> {/* NOVO: Rota para Cadastros */}
          <Route path="/financas" element={<Navigate to="/financeiro/minhas" replace />} /> {/* Redirect antigo */}
          <Route path="/financeiro" element={<Navigate to="/financeiro/minhas" replace />} /> {/* Redirect */}
          <Route path="/financeiro/minhas" element={<ProtectedRoute><Financas /></ProtectedRoute>} /> {/* NOVO: Rota para Minhas Finanças */}
          <Route path="/financeiro/caixas" element={<ProtectedRoute><Caixas /></ProtectedRoute>} /> {/* NOVO: Rota para Caixas */}
          <Route path="/rh" element={<ProtectedRoute><RH /></ProtectedRoute>} /> {/* NOVO: Rota para RH */}
          <Route path="/whatsapp" element={<ProtectedRoute><WhatsApp /></ProtectedRoute>} /> {/* NOVO: Rota para WhatsApp */}

          {/* Rotas de Setup */}
          <Route path="/setup" element={<Setup />} />
          <Route path="/init-admin" element={<InitAdmin />} />
          <Route path="/auto-setup" element={<AutoSetup />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider> {/* Envolvendo AppRoutes com SidebarProvider */}
            <AppRoutes />
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
