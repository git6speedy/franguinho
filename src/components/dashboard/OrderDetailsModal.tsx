import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderDetailsModalProps {
  order: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OrderDetailsModal({ order, open, onOpenChange }: OrderDetailsModalProps) {
  if (!order) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Pedido #{order.order_number}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 py-4">
            {/* Status e Canal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={statusColors[order.status] || "bg-gray-100 text-gray-800"}>
                  {statusLabels[order.status] || order.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Canal</p>
                <p className="text-sm font-medium">{sourceLabels[order.source] || order.source}</p>
              </div>
            </div>

            {/* Cliente */}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cliente</p>
              <p className="text-sm font-medium">
                {order.customer_name || order.customers?.name || "Cliente Anônimo"}
              </p>
              {order.customers?.phone && (
                <p className="text-xs text-muted-foreground">{order.customers.phone}</p>
              )}
            </div>

            {/* Horários */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hora do Pedido</p>
                <p className="text-sm">
                  {format(parseISO(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
              {order.updated_at && order.updated_at !== order.created_at && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
                  <p className="text-sm">
                    {format(parseISO(order.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>

            {/* Forma de Pagamento */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Forma de Pagamento</p>
                <p className="text-sm font-medium">{order.payment_method || "Não informado"}</p>
              </div>
              {order.card_machines?.name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Maquininha</p>
                  <p className="text-sm font-medium">{order.card_machines.name}</p>
                </div>
              )}
            </div>

            {/* ID do Caixa */}
            {order.cash_register_id && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID do Caixa</p>
                <p className="text-sm font-mono">{order.cash_register_id}</p>
              </div>
            )}

            {/* Entrega */}
            {order.delivery && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Endereço de Entrega</p>
                <div className="text-sm">
                  <p>{order.delivery_address}, {order.delivery_number}</p>
                  {order.delivery_neighborhood && <p>{order.delivery_neighborhood}</p>}
                  {order.delivery_reference && <p className="text-muted-foreground">Ref: {order.delivery_reference}</p>}
                  {order.delivery_cep && <p className="text-muted-foreground">CEP: {order.delivery_cep}</p>}
                </div>
              </div>
            )}

            {/* Itens do Pedido */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Itens do Pedido</p>
              <div className="space-y-2">
                {order.order_items?.map((item: any, index: number) => (
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

            {/* Total */}
            <div className="border-t pt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
