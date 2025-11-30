import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUp, 
  Trash2, 
  X, 
  DollarSign,
  Lock,
  Info,
  Printer,
  Download,
  Leaf,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import PerishableControlModal from "@/components/dashboard/PerishableControlModal";

interface CashRegister {
  id: string;
  opened_at: string;
  closed_at: string | null;
  initial_amount: number;
  final_amount: number | null;
  opened_by: string;
  user_name?: string;
}

interface CashSummary {
  productsSold: { name: string; quantity: number; }[];
  paymentMethodTotals: { method: string; total: number; }[];
  totalSales: number;
  initialAmount: number;
  finalAmount?: number;
  openedAt: string;
  closedAt?: string;
  ordersBySource: { source: string; count: number; }[];
  totalDiscount: number;
  loyaltyOrdersCount: number;
  orders?: any[]; // Para relatório analítico
}

export default function Caixas() {
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [totalRegisters, setTotalRegisters] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [goToPage, setGoToPage] = useState("");
  
  // Delete dialog
  const [registerToDelete, setRegisterToDelete] = useState<CashRegister | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  
  // Close register
  const [registerToClose, setRegisterToClose] = useState<CashRegister | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [finalAmount, setFinalAmount] = useState("");
  
  // View details
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<CashSummary | null>(null);
  
  // Sangria e Adição
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [showAdditionDialog, setShowAdditionDialog] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [additionAmount, setAdditionAmount] = useState("");
  const [additionReason, setAdditionReason] = useState("");
  
  // Print dialog
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printType, setPrintType] = useState<"synthetic" | "analytic">("synthetic");
  
  // Perishable control
  const [showPerishableModal, setShowPerishableModal] = useState(false);
  const [selectedPerishableRegisterId, setSelectedPerishableRegisterId] = useState<string | null>(null);
  const [perishableRecordId, setPerishableRecordId] = useState<string | null>(null);
  const [perishableControlEnabled, setPerishableControlEnabled] = useState(false);

  const { profile, user } = useAuth();
  const totalPages = Math.ceil(totalRegisters / itemsPerPage);

  const loadCashRegisters = useCallback(async () => {
    if (!profile?.store_id) return;

    setLoading(true);

    // Contar total de registros
    let countQuery = supabase
      .from("cash_register")
      .select("id", { count: "exact", head: true })
      .eq("store_id", profile.store_id);

    if (filterDate) {
      const startOfDay = `${filterDate}T00:00:00`;
      const endOfDay = `${filterDate}T23:59:59`;
      countQuery = countQuery.gte("opened_at", startOfDay).lte("opened_at", endOfDay);
    }

    const { count } = await countQuery;
    setTotalRegisters(count || 0);

    // Buscar caixas paginados
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    let query = supabase
      .from("cash_register")
      .select("*")
      .eq("store_id", profile.store_id)
      .order("opened_at", { ascending: false })
      .range(from, to);

    if (filterDate) {
      const startOfDay = `${filterDate}T00:00:00`;
      const endOfDay = `${filterDate}T23:59:59`;
      query = query.gte("opened_at", startOfDay).lte("opened_at", endOfDay);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Erro ao carregar caixas: " + error.message);
      setLoading(false);
      return;
    }

    // Buscar nomes dos usuários
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(r => r.opened_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      
      const registersWithNames = data.map(register => ({
        ...register,
        user_name: profilesMap.get(register.opened_by) || "N/A",
      }));

      setCashRegisters(registersWithNames);
    } else {
      setCashRegisters([]);
    }

    setLoading(false);
  }, [profile?.store_id, filterDate, currentPage, itemsPerPage]);

  useEffect(() => {
    loadCashRegisters();
  }, [loadCashRegisters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, itemsPerPage]);

  useEffect(() => {
    if (profile?.store_id) {
      loadPerishableControlSetting();
    }
  }, [profile?.store_id]);

  const loadPerishableControlSetting = async () => {
    if (!profile?.store_id) return;
    const { data } = await supabase
      .from("stores")
      .select("perishable_control_enabled")
      .eq("id", profile.store_id)
      .single();
    
    if (data) {
      setPerishableControlEnabled(data.perishable_control_enabled ?? false);
    }
  };

  const handleOpenPerishableModal = async (registerId: string) => {
    // Check if there's an existing perishable record for this cash register
    const { data } = await supabase
      .from("perishable_records")
      .select("id")
      .eq("cash_register_id", registerId)
      .maybeSingle();
    
    setSelectedPerishableRegisterId(registerId);
    setPerishableRecordId(data?.id || null);
    setShowPerishableModal(true);
  };

  const handleClearFilters = () => {
    setFilterDate("");
    setCurrentPage(1);
  };

  const handleWithdrawal = async () => {
    if (!registerToClose || !withdrawalAmount || !withdrawalReason) {
      toast.error("Preencha o valor e o motivo");
      return;
    }

    try {
      // Criar uma transação financeira de sangria
      const { error: transactionError } = await supabase
        .from("financial_transactions")
        .insert({
          store_id: profile.store_id,
          type: "despesa",
          description: `Sangria do caixa - ${withdrawalReason}`,
          amount: parseFloat(withdrawalAmount),
          transaction_date: new Date().toISOString().split('T')[0],
          status: "pago",
          notes: `Sangria realizada do caixa ${registerToClose.id}`,
        });

      if (transactionError) throw transactionError;

      toast.success("Sangria registrada com sucesso!");
      setShowWithdrawalDialog(false);
      setWithdrawalAmount("");
      setWithdrawalReason("");
      loadCashRegisters();
    } catch (error: any) {
      toast.error("Erro ao registrar sangria: " + error.message);
    }
  };

  const handleAddition = async () => {
    if (!registerToClose || !additionAmount || !additionReason) {
      toast.error("Preencha o valor e o motivo");
      return;
    }

    try {
      // Criar uma transação financeira de adição
      const { error: transactionError } = await supabase
        .from("financial_transactions")
        .insert({
          store_id: profile.store_id,
          type: "receita",
          description: `Adição ao caixa - ${additionReason}`,
          amount: parseFloat(additionAmount),
          transaction_date: new Date().toISOString().split('T')[0],
          status: "pago",
          notes: `Adição realizada ao caixa ${registerToClose.id}`,
        });

      if (transactionError) throw transactionError;

      toast.success("Adição registrada com sucesso!");
      setShowAdditionDialog(false);
      setAdditionAmount("");
      setAdditionReason("");
      loadCashRegisters();
    } catch (error: any) {
      toast.error("Erro ao registrar adição: " + error.message);
    }
  };

  const handleCloseRegister = async () => {
    if (!registerToClose || !finalAmount) {
      toast.error("Preencha o valor final");
      return;
    }

    try {
      const { error } = await supabase
        .from("cash_register")
        .update({
          closed_at: new Date().toISOString(),
          final_amount: parseFloat(finalAmount),
        })
        .eq("id", registerToClose.id);

      if (error) throw error;

      toast.success("Caixa fechado com sucesso!");
      setShowCloseDialog(false);
      setRegisterToClose(null);
      setFinalAmount("");
      loadCashRegisters();
    } catch (error: any) {
      toast.error("Erro ao fechar caixa: " + error.message);
    }
  };

  const confirmDelete = () => {
    setShowDeleteDialog(false);
    setShowPasswordDialog(true);
  };

  const handleDeleteRegister = async () => {
    if (!registerToDelete || !password || !user) {
      toast.error("Digite sua senha");
      return;
    }

    try {
      // Verificar senha
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password,
      });

      if (signInError) {
        toast.error("Senha incorreta");
        return;
      }

      // Buscar pedidos vinculados ao caixa
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("cash_register_id", registerToDelete.id);

      if (orders && orders.length > 0) {
        // Deletar itens dos pedidos
        for (const order of orders) {
          await supabase
            .from("order_items")
            .delete()
            .eq("order_id", order.id);
        }

        // Deletar pedidos
        await supabase
          .from("orders")
          .delete()
          .eq("cash_register_id", registerToDelete.id);
      }

      // Deletar caixa
      const { error } = await supabase
        .from("cash_register")
        .delete()
        .eq("id", registerToDelete.id);

      if (error) throw error;

      toast.success("Caixa excluído com sucesso!");
      setShowPasswordDialog(false);
      setRegisterToDelete(null);
      setPassword("");
      loadCashRegisters();
    } catch (error: any) {
      toast.error("Erro ao excluir caixa: " + error.message);
    }
  };

  const handleGoToPage = () => {
    const pageNum = parseInt(goToPage, 10);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setGoToPage("");
    } else {
      toast.error(`Digite um número entre 1 e ${totalPages}`);
    }
  };

  const calculateCashSummary = async (register: CashRegister): Promise<CashSummary | null> => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          payment_method,
          payment_methods,
          payment_amounts,
          total,
          status,
          source,
          discount_amount,
          customer_name,
          customers (name),
          order_items (
            product_name,
            quantity,
            variation_name,
            product_price,
            subtotal
          )
        `)
        .eq("cash_register_id", register.id);

      if (error) throw error;

      const paymentMethodTotals: { [key: string]: number } = {};
      const ordersBySourceMap = new Map<string, number>();
      let loyaltyOrdersCount = 0;
      let totalSales = 0;
      let totalDiscount = 0;
      const productsSoldMap = new Map<string, number>();

      orders?.forEach((order: any) => {
        if (order.status === 'cancelled') return;

        const sourceKey = order.source || 'presencial';
        ordersBySourceMap.set(sourceKey, (ordersBySourceMap.get(sourceKey) || 0) + 1);

        const orderTotal = parseFloat(order.total.toString());
        totalSales += orderTotal;

        if (order.discount_amount) {
          totalDiscount += parseFloat(order.discount_amount.toString());
        }

        const paymentMethodLower = order.payment_method ? order.payment_method.toLowerCase() : '';
        if (paymentMethodLower.includes('fidelidade')) {
          loyaltyOrdersCount++;
        }

        // Handle multiple payment methods
        if (order.payment_methods && order.payment_amounts) {
          const methods = order.payment_methods as string[];
          const amounts = order.payment_amounts as { [key: string]: number };
          
          methods.forEach(method => {
            const amount = amounts[method] || 0;
            const methodKey = method.toLowerCase();
            paymentMethodTotals[methodKey] = (paymentMethodTotals[methodKey] || 0) + amount;
          });
        } else if (orderTotal > 0) {
          const methodKey = paymentMethodLower.replace('fidelidade', '').trim() || paymentMethodLower;
          paymentMethodTotals[methodKey] = (paymentMethodTotals[methodKey] || 0) + orderTotal;
        }

        order.order_items?.forEach((item: any) => {
          const itemName = item.variation_name ? `${item.product_name} (${item.variation_name})` : item.product_name;
          productsSoldMap.set(itemName, (productsSoldMap.get(itemName) || 0) + item.quantity);
        });
      });

      const productsSold = Array.from(productsSoldMap.entries()).map(([name, quantity]) => ({ name, quantity }));

      const paymentMethodTotalsArray = Object.entries(paymentMethodTotals).map(([method, total]) => ({
        method: method.charAt(0).toUpperCase() + method.slice(1),
        total,
      })).filter(pm => pm.total > 0);

      const sourceDisplayNames: Record<string, string> = {
        totem: "Totem",
        whatsapp: "WhatsApp",
        loja_online: "Loja Online",
        presencial: "Presencial",
        ifood: "Ifood",
      };

      const ordersBySource = Array.from(ordersBySourceMap.entries()).map(([sourceKey, count]) => ({
        source: sourceDisplayNames[sourceKey] || sourceKey,
        count,
      }));

      return {
        productsSold,
        paymentMethodTotals: paymentMethodTotalsArray,
        totalSales,
        initialAmount: register.initial_amount,
        finalAmount: register.final_amount || undefined,
        openedAt: register.opened_at,
        closedAt: register.closed_at || undefined,
        ordersBySource,
        totalDiscount,
        loyaltyOrdersCount,
        orders: orders || [],
      };
    } catch (error: any) {
      toast.error("Erro ao calcular resumo: " + error.message);
      return null;
    }
  };

  const handleViewDetails = async (register: CashRegister) => {
    const summary = await calculateCashSummary(register);
    if (summary) {
      setSelectedSummary(summary);
      setShowDetailsDialog(true);
    }
  };

  const handlePrint = async (register: CashRegister) => {
    const summary = await calculateCashSummary(register);
    if (summary) {
      setSelectedSummary(summary);
      setShowPrintDialog(true);
    }
  };

  const generatePrintContent = () => {
    if (!selectedSummary) return "";

    if (printType === "synthetic") {
      return generateSyntheticReport();
    } else {
      return generateAnalyticReport();
    }
  };

  const generateSyntheticReport = () => {
    if (!selectedSummary) return "";

    return `
      <h1>Relatório Sintético de Caixa</h1>
      <p>Data de Abertura: ${format(new Date(selectedSummary.openedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      ${selectedSummary.closedAt ? `<p>Data de Fechamento: ${format(new Date(selectedSummary.closedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>` : ''}
      
      <div class="section">
        <h2>Resumo Financeiro</h2>
        <table>
          <tr><th>Item</th><th>Valor</th></tr>
          <tr><td>Valor Inicial</td><td>R$ ${selectedSummary.initialAmount.toFixed(2)}</td></tr>
          ${selectedSummary.totalDiscount > 0 ? `<tr><td style="color: red;">Desconto Total</td><td style="color: red;">- R$ ${selectedSummary.totalDiscount.toFixed(2)}</td></tr>` : ''}
          <tr><td>Total de Vendas</td><td>R$ ${selectedSummary.totalSales.toFixed(2)}</td></tr>
          ${selectedSummary.finalAmount ? `<tr><td><strong>Valor Final</strong></td><td><strong>R$ ${selectedSummary.finalAmount.toFixed(2)}</strong></td></tr>` : ''}
        </table>
      </div>

      <div class="section">
        <h2>Formas de Pagamento</h2>
        <table>
          <tr><th>Método</th><th>Total</th></tr>
          ${selectedSummary.paymentMethodTotals.map((pm: any) => `<tr><td>${pm.method}</td><td>R$ ${pm.total.toFixed(2)}</td></tr>`).join('')}
        </table>
      </div>

      ${selectedSummary.ordersBySource && selectedSummary.ordersBySource.length > 0 ? `
      <div class="section">
        <h2>Pedidos por Canal</h2>
        <table>
          <tr><th>Canal</th><th>Quantidade</th></tr>
          ${selectedSummary.ordersBySource.map((os: any) => `<tr><td>${os.source}</td><td>${os.count}</td></tr>`).join('')}
        </table>
      </div>
      ` : ''}

      <div class="section">
        <h2>Produtos Vendidos</h2>
        <table>
          <tr><th>Produto</th><th>Quantidade</th></tr>
          ${selectedSummary.productsSold.map((p: any) => `<tr><td>${p.name}</td><td>${p.quantity}</td></tr>`).join('')}
        </table>
      </div>
    `;
  };

  const generateAnalyticReport = () => {
    if (!selectedSummary || !selectedSummary.orders) return "";

    // Group orders by payment method
    const ordersByPaymentMethod: { [key: string]: any[] } = {};
    
    selectedSummary.orders.forEach((order: any) => {
      if (order.status === 'cancelled') return;

      // Handle multiple payment methods
      if (order.payment_methods && order.payment_amounts) {
        const methods = order.payment_methods as string[];
        const paymentMethodsStr = methods.join(" + ");
        
        if (!ordersByPaymentMethod[paymentMethodsStr]) {
          ordersByPaymentMethod[paymentMethodsStr] = [];
        }
        ordersByPaymentMethod[paymentMethodsStr].push(order);
      } else {
        const method = order.payment_method || "Não especificado";
        if (!ordersByPaymentMethod[method]) {
          ordersByPaymentMethod[method] = [];
        }
        ordersByPaymentMethod[method].push(order);
      }
    });

    let analyticsHTML = `
      <h1>Relatório Analítico de Caixa</h1>
      <p>Data de Abertura: ${format(new Date(selectedSummary.openedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      ${selectedSummary.closedAt ? `<p>Data de Fechamento: ${format(new Date(selectedSummary.closedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>` : ''}
      
      <div class="section">
        <h2>Resumo Geral</h2>
        <table>
          <tr><th>Item</th><th>Valor</th></tr>
          <tr><td>Valor Inicial</td><td>R$ ${selectedSummary.initialAmount.toFixed(2)}</td></tr>
          ${selectedSummary.totalDiscount > 0 ? `<tr><td style="color: red;">Desconto Total</td><td style="color: red;">- R$ ${selectedSummary.totalDiscount.toFixed(2)}</td></tr>` : ''}
          <tr><td>Total de Vendas</td><td>R$ ${selectedSummary.totalSales.toFixed(2)}</td></tr>
          ${selectedSummary.finalAmount ? `<tr><td><strong>Valor Final</strong></td><td><strong>R$ ${selectedSummary.finalAmount.toFixed(2)}</strong></td></tr>` : ''}
        </table>
      </div>
    `;

    // Add orders grouped by payment method
    Object.entries(ordersByPaymentMethod).forEach(([method, orders]) => {
      const subtotal = orders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);

      analyticsHTML += `
        <div class="section">
          <h2>${method} - Subtotal: R$ ${subtotal.toFixed(2)}</h2>
          <table>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Itens</th>
              <th>Desconto</th>
              <th>Total</th>
            </tr>
            ${orders.map(order => {
              const customerName = order.customers?.name || order.customer_name || "Anônimo";
              const itemsList = order.order_items?.map((item: any) => 
                `${item.product_name}${item.variation_name ? ` (${item.variation_name})` : ''} x${item.quantity}`
              ).join(", ") || "";
              const discount = order.discount_amount ? parseFloat(order.discount_amount.toString()) : 0;

              // Show payment split if multiple methods
              let paymentInfo = "";
              if (order.payment_methods && order.payment_amounts) {
                const methods = order.payment_methods as string[];
                const amounts = order.payment_amounts as { [key: string]: number };
                paymentInfo = "<br><small>" + methods.map(m => `${m}: R$ ${amounts[m].toFixed(2)}`).join(", ") + "</small>";
              }

              return `
                <tr>
                  <td>#${order.order_number}</td>
                  <td>${customerName}</td>
                  <td>${itemsList}</td>
                  <td>${discount > 0 ? `R$ ${discount.toFixed(2)}` : '-'}</td>
                  <td>R$ ${parseFloat(order.total.toString()).toFixed(2)}${paymentInfo}</td>
                </tr>
              `;
            }).join('')}
          </table>
        </div>
      `;
    });

    analyticsHTML += `
      <div class="section">
        <h2>Pedidos por Canal</h2>
        <table>
          <tr><th>Canal</th><th>Quantidade</th></tr>
          ${selectedSummary.ordersBySource.map((os: any) => `<tr><td>${os.source}</td><td>${os.count}</td></tr>`).join('')}
        </table>
      </div>

      <div class="section">
        <h2>Produtos Vendidos</h2>
        <table>
          <tr><th>Produto</th><th>Quantidade</th></tr>
          ${selectedSummary.productsSold.map((p: any) => `<tr><td>${p.name}</td><td>${p.quantity}</td></tr>`).join('')}
        </table>
      </div>
    `;

    return analyticsHTML;
  };

  const executePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = generatePrintContent();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Caixa</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 20px; margin-bottom: 10px; }
            h2 { font-size: 16px; margin: 15px 0 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .section { margin-bottom: 30px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          ${printContent}
          <div style="margin-top: 20px;">
            <button onclick="window.print()">Imprimir</button>
            <button onclick="window.close()">Fechar</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setShowPrintDialog(false);
  };

  const handleExportCSV = () => {
    if (!selectedSummary) return;

    const csvRows = [];
    
    if (printType === "analytic" && selectedSummary.orders) {
      csvRows.push(["Tipo", "ID Pedido", "Cliente", "Itens", "Forma de Pagamento", "Desconto", "Total"]);
      
      selectedSummary.orders.forEach((order: any) => {
        if (order.status === 'cancelled') return;

        const customerName = order.customers?.name || order.customer_name || "Anônimo";
        const itemsList = order.order_items?.map((item: any) => 
          `${item.product_name}${item.variation_name ? ` (${item.variation_name})` : ''} x${item.quantity}`
        ).join("; ") || "";
        
        let paymentInfo = order.payment_method || "";
        if (order.payment_methods && order.payment_amounts) {
          const methods = order.payment_methods as string[];
          const amounts = order.payment_amounts as { [key: string]: number };
          paymentInfo = methods.map(m => `${m}: R$ ${amounts[m].toFixed(2)}`).join(" | ");
        }

        const discount = order.discount_amount ? parseFloat(order.discount_amount.toString()) : 0;
        
        csvRows.push([
          "Pedido",
          order.order_number,
          customerName,
          itemsList,
          paymentInfo,
          discount > 0 ? `R$ ${discount.toFixed(2)}` : '-',
          `R$ ${parseFloat(order.total.toString()).toFixed(2)}`
        ]);
      });
    } else {
      csvRows.push(["Tipo", "Nome", "Quantidade/Valor"]);
      csvRows.push(["Data de Abertura", format(new Date(selectedSummary.openedAt), "dd/MM/yyyy HH:mm", { locale: ptBR }), ""]);
      if (selectedSummary.closedAt) {
        csvRows.push(["Data de Fechamento", format(new Date(selectedSummary.closedAt), "dd/MM/yyyy HH:mm", { locale: ptBR }), ""]);
      }
      csvRows.push(["Valor Inicial", `R$ ${selectedSummary.initialAmount.toFixed(2)}`, ""]);
      csvRows.push(["Total de Vendas", `R$ ${selectedSummary.totalSales.toFixed(2)}`, ""]);
      if (selectedSummary.finalAmount) {
        csvRows.push(["Valor Final", `R$ ${selectedSummary.finalAmount.toFixed(2)}`, ""]);
      }
      csvRows.push(["", "", ""]);
      csvRows.push(["Formas de Pagamento", "", ""]);
      selectedSummary.paymentMethodTotals.forEach(pm => {
        csvRows.push([pm.method, `R$ ${pm.total.toFixed(2)}`, ""]);
      });
    }

    const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `caixa_${format(new Date(selectedSummary.openedAt), "yyyyMMdd_HHmm")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV exportado com sucesso!");
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisiblePages = 3;

    pages.push(1);

    if (currentPage > maxVisiblePages) {
      pages.push("...");
    }

    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (currentPage < totalPages - maxVisiblePages + 1) {
      pages.push("...");
    }

    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Itens por página:</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => setItemsPerPage(parseInt(value, 10))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pages.map((page, index) => (
            <span key={index}>
              {page === "..." ? (
                <span className="px-2 text-muted-foreground">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  onClick={() => setCurrentPage(page as number)}
                >
                  {page}
                </Button>
              )}
            </span>
          ))}

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 ml-2">
            <Input
              type="number"
              placeholder="Pg"
              value={goToPage}
              onChange={(e) => setGoToPage(e.target.value)}
              className="w-16 h-9"
              min={1}
              max={totalPages}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleGoToPage}
              title="Ir para página"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <span className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages} ({totalRegisters} caixas)
        </span>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Caixas</h1>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtrar por Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Caixas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Histórico de Caixas ({totalRegisters})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando caixas...
            </div>
          ) : cashRegisters.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum caixa encontrado
            </div>
          ) : (
            <div className="space-y-3">
              {cashRegisters.map((register) => (
                <div
                  key={register.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">ID: {register.id.slice(0, 8)}</span>
                      {register.closed_at ? (
                        <Badge variant="secondary">Fechado</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Aberto</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <strong>Usuário:</strong> {register.user_name || "N/A"}
                      </p>
                      <p>
                        <strong>Abertura:</strong>{" "}
                        {format(new Date(register.opened_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                      {register.closed_at && (
                        <p>
                          <strong>Fechamento:</strong>{" "}
                          {format(new Date(register.closed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                      <p>
                        <strong>Valor Inicial:</strong> R$ {register.initial_amount.toFixed(2)}
                      </p>
                      {register.final_amount !== null && (
                        <p>
                          <strong>Valor Final:</strong> R$ {register.final_amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {!register.closed_at && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setRegisterToClose(register);
                          setShowCloseDialog(true);
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        Fechar
                      </Button>
                    )}
                    {register.closed_at && perishableControlEnabled && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPerishableModal(register.id)}
                        title="Controle de Perecíveis"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <Leaf className="h-4 w-4 mr-1" />
                        Perecíveis
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(register)}
                      title="Ver detalhes"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePrint(register)}
                      title="Imprimir relatório"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setRegisterToDelete(register);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {renderPagination()}
        </CardContent>
      </Card>

      {/* Dialog para fechar caixa */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Valor Final</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowWithdrawalDialog(true);
                  setShowCloseDialog(false);
                }}
              >
                Sangria
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAdditionDialog(true);
                  setShowCloseDialog(false);
                }}
              >
                Adição
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCloseRegister}>Confirmar Fechamento</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para excluir */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá excluir o caixa e todas as vendas vinculadas a ele.
              O estoque não será alterado.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Sangria */}
      <Dialog open={showWithdrawalDialog} onOpenChange={setShowWithdrawalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sangria do Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Valor da Sangria</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Motivo</Label>
              <Input
                placeholder="Ex: Compra de grampos"
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowWithdrawalDialog(false);
              setShowCloseDialog(true);
            }}>
              Voltar
            </Button>
            <Button onClick={handleWithdrawal}>Confirmar Sangria</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Adição */}
      <Dialog open={showAdditionDialog} onOpenChange={setShowAdditionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adição ao Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Valor da Adição</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={additionAmount}
                onChange={(e) => setAdditionAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Motivo</Label>
              <Input
                placeholder="Ex: Adição de troco"
                value={additionReason}
                onChange={(e) => setAdditionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAdditionDialog(false);
              setShowCloseDialog(true);
            }}>
              Voltar
            </Button>
            <Button onClick={handleAddition}>Confirmar Adição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de senha */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Confirmação de Senha
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Por segurança, digite sua senha para confirmar a exclusão:
            </p>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPasswordDialog(false);
              setPassword("");
            }}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteRegister}>
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de detalhes do caixa */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Detalhes do Caixa</span>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedSummary && (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Informações Gerais</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Abertura:</strong> {format(new Date(selectedSummary.openedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    {selectedSummary.closedAt && (
                      <p><strong>Fechamento:</strong> {format(new Date(selectedSummary.closedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                    )}
                    <p><strong>Valor Inicial:</strong> R$ {selectedSummary.initialAmount.toFixed(2)}</p>
                    <p><strong>Total de Vendas:</strong> R$ {selectedSummary.totalSales.toFixed(2)}</p>
                    {selectedSummary.totalDiscount > 0 && (
                      <p className="text-red-600"><strong>Desconto Total:</strong> - R$ {selectedSummary.totalDiscount.toFixed(2)}</p>
                    )}
                    {selectedSummary.finalAmount && (
                      <p><strong>Valor Final:</strong> R$ {selectedSummary.finalAmount.toFixed(2)}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Formas de Pagamento</h3>
                  <div className="space-y-1 text-sm">
                    {selectedSummary.paymentMethodTotals.map((pm, idx) => (
                      <p key={idx}><strong>{pm.method}:</strong> R$ {pm.total.toFixed(2)}</p>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Pedidos por Canal</h3>
                  <div className="space-y-1 text-sm">
                    {selectedSummary.ordersBySource.map((os, idx) => (
                      <p key={idx}><strong>{os.source}:</strong> {os.count} pedido(s)</p>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Produtos Vendidos</h3>
                  <div className="space-y-1 text-sm max-h-60 overflow-y-auto">
                    {selectedSummary.productsSold.map((p, idx) => (
                      <p key={idx}>{p.name}: <strong>{p.quantity}</strong> unidade(s)</p>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de impressão */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Imprimir Relatório de Caixa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={printType} onValueChange={(value: any) => setPrintType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="synthetic" id="synthetic" />
                <Label htmlFor="synthetic" className="cursor-pointer">
                  <div>
                    <p className="font-medium">Relatório Sintético</p>
                    <p className="text-sm text-muted-foreground">
                      Resumo geral com totais e formas de pagamento
                    </p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 mt-4">
                <RadioGroupItem value="analytic" id="analytic" />
                <Label htmlFor="analytic" className="cursor-pointer">
                  <div>
                    <p className="font-medium">Relatório Analítico</p>
                    <p className="text-sm text-muted-foreground">
                      Detalhes completos com pedidos individuais e formas de pagamento
                    </p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={executePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Controle de Perecíveis */}
      <PerishableControlModal
        open={showPerishableModal}
        onOpenChange={setShowPerishableModal}
        cashRegisterId={selectedPerishableRegisterId || undefined}
        existingRecordId={perishableRecordId || undefined}
        onSave={() => {
          setShowPerishableModal(false);
          setSelectedPerishableRegisterId(null);
          setPerishableRecordId(null);
        }}
        onCancel={() => {
          setShowPerishableModal(false);
          setSelectedPerishableRegisterId(null);
          setPerishableRecordId(null);
        }}
      />
    </div>
  );
}