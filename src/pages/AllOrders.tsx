import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, Printer, Search, X, Calendar, ChevronLeft, ChevronRight, ArrowUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { printOrder } from "@/utils/printUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Order {
  id: string;
  order_number: string;
  source: string;
  status: string;
  total: number;
  created_at: string;
  payment_method: string;
  payment_methods?: any;
  payment_amounts?: any;
  card_machine_ids?: any;
  delivery: boolean;
  delivery_address?: string;
  delivery_number?: string;
  delivery_neighborhood?: string;
  delivery_reference?: string;
  delivery_cep?: string;
  delivery_fee?: number;
  pickup_time?: string;
  reservation_date?: string;
  customer_id?: string;
  customer_name?: string;
  notes?: string;
  discount_amount?: number;
  change_for?: number;
  updated_at?: string;
  cash_register_id?: string;
  customers?: {
    name: string;
    phone: string;
  };
  card_machines?: {
    name: string;
  };
  order_items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    variation_name?: string;
    product_price: number;
    subtotal: number;
  }>;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-green-100 text-green-800",
  delivered: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "Aguardando",
  preparing: "Em Preparo",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const sourceLabels: Record<string, string> = {
  totem: "Totem",
  whatsapp: "WhatsApp",
  loja_online: "Loja Online",
  presencial: "Presencial",
  ifood: "Ifood",
};

export default function AllOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Filtros
  const [filterDate, setFilterDate] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterPhone, setFilterPhone] = useState("");

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [goToPage, setGoToPage] = useState("");

  const { profile } = useAuth();
  const { toast } = useToast();

  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  const loadOrders = useCallback(async () => {
    if (!profile?.store_id) return;

    setLoading(true);

    // Primeiro, contar o total de registros
    let countQuery = supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", profile.store_id);

    if (filterDate) {
      const startOfDay = `${filterDate}T00:00:00`;
      const endOfDay = `${filterDate}T23:59:59`;
      countQuery = countQuery.gte("created_at", startOfDay).lte("created_at", endOfDay);
    }

    const { count } = await countQuery;
    setTotalOrders(count || 0);

    // Depois, buscar os pedidos paginados
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    let query = supabase
      .from("orders")
      .select(`
        *,
        customers (
          name,
          phone
        ),
        card_machines (
          name
        ),
        order_items (
          product_id,
          product_name,
          quantity,
          variation_name,
          product_price,
          subtotal
        )
      `)
      .eq("store_id", profile.store_id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (filterDate) {
      const startOfDay = `${filterDate}T00:00:00`;
      const endOfDay = `${filterDate}T23:59:59`;
      query = query.gte("created_at", startOfDay).lte("created_at", endOfDay);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar pedidos",
        description: error.message,
      });
      setLoading(false);
      return;
    }

    // Filtrar por nome e telefone localmente
    let filteredData = data || [];

    if (filterName.trim()) {
      const searchName = filterName.toLowerCase().trim();
      filteredData = filteredData.filter((order: Order) => {
        const customerName = order.customers?.name || order.customer_name || "";
        return customerName.toLowerCase().includes(searchName);
      });
    }

    if (filterPhone.trim()) {
      const searchPhone = filterPhone.replace(/\D/g, "");
      filteredData = filteredData.filter((order: Order) => {
        const customerPhone = order.customers?.phone || "";
        return customerPhone.replace(/\D/g, "").includes(searchPhone);
      });
    }

    setOrders(filteredData);
    setLoading(false);
  }, [profile?.store_id, filterDate, filterName, filterPhone, currentPage, itemsPerPage, toast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Reset para página 1 quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterName, filterPhone, itemsPerPage]);

  const handleClearFilters = () => {
    setFilterDate("");
    setFilterName("");
    setFilterPhone("");
    setCurrentPage(1);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      // Primeiro deletar os itens do pedido
      await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderToDelete.id);

      // Depois deletar o pedido
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderToDelete.id);

      if (error) throw error;

      toast({
        title: "Pedido excluído",
        description: `Pedido #${orderToDelete.order_number} foi excluído com sucesso.`,
      });

      setShowDeleteDialog(false);
      setOrderToDelete(null);
      loadOrders();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir pedido",
        description: error.message,
      });
    }
  };

  const handlePrintOrder = (order: Order) => {
    const orderData = {
      order_number: order.order_number,
      created_at: order.created_at,
      customer_name: order.customers?.name || order.customer_name || "Cliente Anônimo",
      customers: order.customers,
      payment_method: order.payment_method || "",
      payment_methods: Array.isArray(order.payment_methods) ? order.payment_methods : undefined,
      payment_amounts: Array.isArray(order.payment_amounts) ? order.payment_amounts : undefined,
      card_machine_name: order.card_machines?.name || "",
      delivery: order.delivery || false,
      delivery_address: order.delivery_address || "",
      delivery_number: order.delivery_number || "",
      delivery_neighborhood: order.delivery_neighborhood || "",
      delivery_reference: order.delivery_reference || "",
      delivery_cep: order.delivery_cep || "",
      delivery_fee: order.delivery_fee || 0,
      pickup_time: order.pickup_time || "",
      reservation_date: order.reservation_date || "",
      notes: order.notes || "",
      discount_amount: order.discount_amount || 0,
      change_for: order.change_for || 0,
      total: order.total,
      source: order.source,
    };

    const orderItems = order.order_items.map((item) => ({
      product_name: item.product_name,
      variation_name: item.variation_name || "",
      quantity: item.quantity,
      product_price: item.product_price,
      subtotal: item.subtotal,
    }));

    printOrder(orderData, orderItems);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleGoToPage = () => {
    const pageNum = parseInt(goToPage, 10);
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setGoToPage("");
    } else {
      toast({
        variant: "destructive",
        title: "Página inválida",
        description: `Digite um número entre 1 e ${totalPages}`,
      });
    }
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
          Página {currentPage} de {totalPages} ({totalOrders} pedidos)
        </span>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Todos os Pedidos</h1>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros de Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filterDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data
              </Label>
              <Input
                id="filterDate"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterName">Nome do Cliente</Label>
              <Input
                id="filterName"
                placeholder="Buscar por nome..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filterPhone">Celular</Label>
              <Input
                id="filterPhone"
                placeholder="Buscar por celular..."
                value={filterPhone}
                onChange={(e) => setFilterPhone(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pedidos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Pedidos ({totalOrders})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando pedidos...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum pedido encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="divide-y">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-bold truncate">
                        {order.customers?.name || order.customer_name || "Cliente Anônimo"}
                      </p>
                      <Badge className={statusColors[order.status] || "bg-gray-100 text-gray-800"}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>#{order.order_number}</span>
                      <span>{sourceLabels[order.source] || order.source}</span>
                      <span>
                        {format(parseISO(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                      <span className="font-medium text-foreground">
                        R$ {order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleViewDetails(order)}
                      title="Ver detalhes"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setOrderToDelete(order);
                        setShowDeleteDialog(true);
                      }}
                      title="Excluir pedido"
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePrintOrder(order)}
                      title="Imprimir pedido"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {renderPagination()}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Pedido #{selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={statusColors[selectedOrder.status] || "bg-gray-100 text-gray-800"}>
                      {statusLabels[selectedOrder.status] || selectedOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Canal</p>
                    <p className="text-sm font-medium">
                      {sourceLabels[selectedOrder.source] || selectedOrder.source}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                  <p className="text-sm font-medium">
                    {selectedOrder.customers?.name || selectedOrder.customer_name || "Cliente Anônimo"}
                  </p>
                  {selectedOrder.customers?.phone && (
                    <p className="text-xs text-muted-foreground">
                      {selectedOrder.customers.phone}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Hora do Pedido</p>
                    <p className="text-sm">
                      {format(parseISO(selectedOrder.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {selectedOrder.updated_at && selectedOrder.updated_at !== selectedOrder.created_at && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
                      <p className="text-sm">
                        {format(parseISO(selectedOrder.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Forma de Pagamento</p>
                    <p className="text-sm font-medium">
                      {selectedOrder.payment_method || "Não informado"}
                    </p>
                  </div>
                  {selectedOrder.card_machines?.name && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Maquininha</p>
                      <p className="text-sm font-medium">{selectedOrder.card_machines.name}</p>
                    </div>
                  )}
                </div>

                {selectedOrder.cash_register_id && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID do Caixa</p>
                    <p className="text-sm font-mono">{selectedOrder.cash_register_id}</p>
                  </div>
                )}

                {selectedOrder.delivery && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Endereço de Entrega</p>
                    <div className="text-sm">
                      <p>{selectedOrder.delivery_address}, {selectedOrder.delivery_number}</p>
                      {selectedOrder.delivery_neighborhood && (
                        <p>{selectedOrder.delivery_neighborhood}</p>
                      )}
                      {selectedOrder.delivery_reference && (
                        <p className="text-muted-foreground">Ref: {selectedOrder.delivery_reference}</p>
                      )}
                      {selectedOrder.delivery_cep && (
                        <p className="text-muted-foreground">CEP: {selectedOrder.delivery_cep}</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Itens do Pedido</p>
                  <div className="space-y-2">
                    {selectedOrder.order_items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm p-2 bg-accent rounded">
                        <div>
                          <p className="font-medium">
                            {item.quantity}x {item.product_name}
                            {item.variation_name && ` (${item.variation_name})`}
                          </p>
                          <p className="text-muted-foreground">R$ {item.product_price.toFixed(2)} cada</p>
                        </div>
                        <p className="font-medium">R$ {item.subtotal.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>R$ {selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o pedido #{orderToDelete?.order_number}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
