import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Gift,
  BarChart2,
  Settings,
  Package,
  Store,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Megaphone,
  Monitor,
  LogOut,
  DollarSign,
  ListTodo,
  Users,
  Wallet,
  UserCog,
  MessageSquare,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import NotificationCenter from '@/components/NotificationCenter';
import { supabase } from '@/integrations/supabase/client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
  hideForAdmin?: boolean;
  subItems?: { name: string; href: string; icon: React.ElementType }[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'PDV', href: '/pdv', icon: ShoppingCart, hideForAdmin: true },
  { 
    name: 'Pedidos', 
    href: '/painel', 
    icon: ClipboardList, 
    hideForAdmin: true,
    subItems: [
      { name: 'Painel de Pedidos', href: '/painel', icon: ClipboardList },
      { name: 'Todos os Pedidos', href: '/painel/todos', icon: FileText },
    ]
  },
  { name: 'WhatsApp', href: '/whatsapp', icon: MessageSquare, hideForAdmin: true },
  { name: 'Fidelidade', href: '/fidelidade', icon: Gift, hideForAdmin: true },
  { name: 'Produtos', href: '/produtos', icon: ShoppingCart, hideForAdmin: true },
  { name: 'Estoque', href: '/estoque', icon: Package, hideForAdmin: true },
{ 
    name: 'Marketing', 
    href: '/marketing', 
    icon: Megaphone, 
    hideForAdmin: true,
    subItems: [
      { name: 'Campanhas WhatsApp', href: '/marketing/campanhas', icon: MessageSquare },
      { name: 'Cupons', href: '/marketing/cupons', icon: Gift },
      { name: 'Insights', href: '/marketing/insights', icon: Sparkles },
      { name: 'Configurações', href: '/marketing', icon: Settings },
    ]
  },
  { name: 'Tarefas', href: '/tarefas', icon: ListTodo, hideForAdmin: true },
  { name: 'Cadastros', href: '/cadastros', icon: Users, hideForAdmin: true },
  { 
    name: 'Financeiro', 
    href: '/financas', 
    icon: Wallet, 
    hideForAdmin: true,
    subItems: [
      { name: 'Minhas Finanças', href: '/financas', icon: Wallet },
      { name: 'Caixas', href: '/financeiro/caixas', icon: DollarSign },
    ]
  },
  { name: 'RH', href: '/rh', icon: UserCog, hideForAdmin: true },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart2 },
  { name: 'Minha Loja', href: '/minha-loja', icon: Store, hideForAdmin: true },
  { name: 'Lojas', href: '/lojas', icon: Store, roles: ['admin'] },
  { name: 'Assinaturas', href: '/assinaturas', icon: DollarSign, roles: ['admin'] },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const { profile, isAdmin, signOut } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [whatsappEnabled, setWhatsappEnabled] = React.useState(false);
  const [storeName, setStoreName] = React.useState("Food Flow");

  // Load WhatsApp enabled status and store name
  React.useEffect(() => {
    const loadStoreData = async () => {
      if (!profile?.store_id) return;
      
      const { data } = await supabase
        .from('stores')
        .select('whatsapp_enabled, name, display_name')
        .eq('id', profile.store_id)
        .single();
      
      if (data) {
        setWhatsappEnabled(data.whatsapp_enabled ?? false);
        setStoreName(data.display_name || data.name || "Food Flow");
      }
    };

    loadStoreData();
  }, [profile?.store_id]);

  const filteredNavItems = navItems.filter(item => {
    // Se o item tem 'roles' e o usuário NÃO tem a role necessária, oculta.
    if (item.roles && !item.roles.some(role => (isAdmin && role === 'admin'))) {
      return false;
    }
    // Se o item tem 'hideForAdmin' como true e o usuário é admin, oculta.
    if (item.hideForAdmin && isAdmin) {
      return false;
    }
    // Esconde WhatsApp se não estiver habilitado
    if (item.name === 'WhatsApp' && !whatsappEnabled) {
      return false;
    }
    return true;
  });

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 shadow-soft',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-4 h-16 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-sidebar-primary truncate">{storeName}</h2>
            <NotificationCenter />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 scrollbar-thin">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href;
            const isSubActive = item.subItems?.some(sub => location.pathname === sub.href);
            const Icon = item.icon;

            if (item.subItems && !isCollapsed) {
              return (
                <li key={item.href}>
                  <Collapsible defaultOpen={isActive || isSubActive}>
                    <CollapsibleTrigger asChild>
                      <button
                        className={cn(
                          'flex items-center w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                          isActive || isSubActive
                            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="truncate flex-1 text-left">{item.name}</span>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 flex-shrink-0 [&[data-state=open]]:rotate-180" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ul className="ml-8 mt-1 space-y-1">
                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubItemActive = location.pathname === subItem.href;
                          return (
                            <li key={subItem.href}>
                              <Link
                                to={subItem.href}
                                className={cn(
                                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                                  isSubItemActive
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                                )}
                              >
                                <SubIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="truncate">{subItem.name}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                </li>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    isCollapsed && 'justify-center'
                  )}
                >
                  <Icon className={cn('h-5 w-5 flex-shrink-0', !isCollapsed && 'mr-3')} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto p-4 border-t border-sidebar-border bg-sidebar">
        {!isCollapsed && (
          <div className="mb-3">
            <p className="font-semibold text-sm text-sidebar-foreground truncate">{profile?.full_name || 'Usuário'}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full flex items-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors rounded-lg",
            isCollapsed ? "justify-center px-2" : "justify-start px-3"
          )}
          onClick={signOut}
        >
          <LogOut className={cn('h-5 w-5 flex-shrink-0', !isCollapsed && 'mr-3')} />
          {!isCollapsed && <span className="truncate">Deslogar</span>}
        </Button>
      </div>
    </aside>
  );
}