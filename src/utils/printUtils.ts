// Função utilitária para impressão de pedidos reutilizada em toda aplicação

export interface PrintOrderData {
  order_number: string;
  created_at: string;
  customer_name?: string;
  customers?: {
    name: string;
    phone: string;
  };
  payment_method?: string;
  payment_methods?: string[]; // Múltiplos pagamentos
  payment_amounts?: number[]; // Valores de cada pagamento
  delivery?: boolean;
  delivery_address?: string;
  delivery_number?: string;
  delivery_neighborhood?: string;
  delivery_reference?: string;
  delivery_cep?: string;
  delivery_fee?: number;
  pickup_time?: string;
  reservation_date?: string;
  notes?: string;
  discount_amount?: number;
  total: number;
  change_for?: number;
  source?: string;
  card_machine_name?: string; // Nome da maquininha usada
  card_machine_names?: string[]; // Nomes das maquininhas para múltiplos pagamentos
}

export interface PrintOrderItem {
  product_name: string;
  quantity: number;
  variation_name?: string;
  product_price: number;
  subtotal: number;
}

// Função auxiliar para parsear datas no formato YYYY-MM-DD sem problemas de timezone
const parseDateString = (dateString: string): string => {
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateString;
};

// Determina a tarja de pagamento baseada no método
const getPaymentBanner = (paymentMethod: string): { text: string; show: boolean } => {
  if (!paymentMethod) return { text: '', show: false };
  
  const method = paymentMethod.toLowerCase().trim();
  
  // Métodos que mostram "PAGO"
  const paidMethods = ['pix', 'credito', 'crédito', 'debito', 'débito', 'dinheiro'];
  if (paidMethods.some(m => method.includes(m))) {
    return { text: 'PAGO', show: true };
  }
  
  // iFood
  if (method.includes('ifood')) {
    return { text: 'IFOOD', show: true };
  }
  
  // Reserva - não mostra nada
  if (method.includes('reserva')) {
    return { text: '', show: false };
  }
  
  // Fidelidade - não mostra nada
  if (method.includes('fidelidade')) {
    return { text: '', show: false };
  }
  
  // Método customizado - mostra o nome do método
  return { text: paymentMethod.toUpperCase(), show: true };
};

export const printOrder = (order: PrintOrderData, orderItems: PrintOrderItem[]) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const customerName = order.customers?.name || order.customer_name || 'Cliente Anônimo';
  const customerPhone = order.customers?.phone || '';
  const orderDate = new Date(order.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Data e hora da reserva (se houver)
  let reservationDateTime = '';
  if (order.reservation_date && order.pickup_time) {
    const dateStr = parseDateString(order.reservation_date);
    reservationDateTime = `${dateStr}, ${order.pickup_time}`;
  } else if (order.reservation_date) {
    reservationDateTime = parseDateString(order.reservation_date);
  } else if (order.pickup_time) {
    reservationDateTime = order.pickup_time;
  }

  // Determina a tarja de pagamento
  const paymentBanner = getPaymentBanner(order.payment_method || '');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pedido #${order.order_number}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            max-width: 300px;
            margin: 20px auto;
            padding: 0;
            font-size: 12px;
            text-transform: uppercase;
          }
          .header {
            text-align: center;
            background-color: #2a2a2a !important;
            color: white;
            padding: 15px 10px;
            margin-bottom: 10px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          .header h1 {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .header .datetime {
            margin-top: 5px;
            font-size: 13px;
            opacity: 0.95;
            font-weight: bold;
          }
          .content {
            padding: 10px;
          }
          .order-info {
            margin-bottom: 5px;
          }
          .order-info div {
            margin: 2px 0;
            font-size: 12px;
          }
          .section {
            margin: 5px 0;
            padding: 5px 0;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 3px;
            font-size: 12px;
          }
          .section div {
            font-size: 12px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          .divider {
            border-top: 1px dashed #333;
            margin: 8px 0;
          }
          .total {
            font-size: 14px;
            font-weight: bold;
            margin-top: 8px;
          }
          .footer {
            text-align: center;
            margin-top: 10px;
            font-size: 11px;
          }
          .payment-banner {
            text-align: center;
            background-color: #000000 !important;
            color: white;
            padding: 15px 10px;
            margin-top: 15px;
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 2px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            .header, .payment-banner {
              background-color: #2a2a2a !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .payment-banner {
              background-color: #000000 !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${customerName.toUpperCase()}</h1>
          ${reservationDateTime ? `<div class="datetime">${reservationDateTime.toUpperCase()}</div>` : ''}
        </div>

        <div class="content">
          <div class="order-info">
            <div>PEDIDO #${order.order_number}</div>
            ${customerPhone ? `<div>Nº: ${customerPhone}</div>` : ''}
            <div>${orderDate}</div>
          </div>

          ${order.delivery ? `
            <div class="divider"></div>
            <div class="section">
              <div class="section-title">ENTREGA</div>
              <div>${order.delivery_address ? order.delivery_address.toUpperCase() : ''}, ${order.delivery_number || ''}</div>
              ${order.delivery_neighborhood ? `<div>${order.delivery_neighborhood.toUpperCase()}</div>` : ''}
              ${order.delivery_reference ? `<div>REF: ${order.delivery_reference.toUpperCase()}</div>` : ''}
              ${order.delivery_cep ? `<div>CEP: ${order.delivery_cep}</div>` : ''}
            </div>
          ` : ''}

          ${order.pickup_time && !order.reservation_date ? `
            <div class="divider"></div>
            <div class="section">
              <div class="section-title">RETIRADA</div>
              <div>HORÁRIO: ${order.pickup_time.toUpperCase()}</div>
            </div>
          ` : ''}

          ${order.reservation_date ? `
            <div class="divider"></div>
            <div class="section">
              <div class="section-title">RESERVA</div>
              <div>DATA: ${parseDateString(order.reservation_date)}</div>
              ${order.pickup_time ? `<div>HORÁRIO: ${order.pickup_time}</div>` : ''}
            </div>
          ` : ''}

          <div class="divider"></div>

          <div class="section">
            <div class="section-title">ITENS DO PEDIDO</div>
            ${orderItems.map(item => {
              const isRedeemed = item.product_price === 0 && item.subtotal === 0;
              return `
                <div class="item">
                  <span>${item.quantity}X ${item.product_name.toUpperCase()}${item.variation_name ? ` (${item.variation_name.toUpperCase()})` : ''}${isRedeemed ? ' ⭐' : ''}</span>
                  <span>${isRedeemed ? 'RESGATADO' : `R$ ${item.subtotal.toFixed(2)}`}</span>
                </div>
              `;
            }).join('')}
          </div>

          ${order.delivery_fee && order.delivery_fee > 0 ? `
            <div class="divider"></div>
            <div class="section">
              <div>TAXA DE ENTREGA: R$ ${order.delivery_fee.toFixed(2)}</div>
            </div>
          ` : ''}

          ${order.discount_amount && order.discount_amount > 0 ? `
            <div class="divider"></div>
            <div class="section">
              <div>DESCONTO: - R$ ${order.discount_amount.toFixed(2)}</div>
            </div>
          ` : ''}

          <div class="divider"></div>

          ${order.notes ? `
            <div class="section">
              <div class="section-title">OBSERVAÇÃO</div>
              <div>${order.notes.toUpperCase()}</div>
            </div>
            <div class="divider"></div>
          ` : ''}

          <div class="section">
            <div class="section-title">PAGAMENTO</div>
            ${order.payment_methods && order.payment_amounts && order.payment_methods.length > 0 ? `
              ${order.payment_methods.map((method, index) => `
                <div class="item">
                  <span>${method.toUpperCase()}</span>
                  <span>R$ ${order.payment_amounts[index].toFixed(2)}</span>
                </div>
                ${order.card_machine_names && order.card_machine_names[index] ? `<div style="font-size: 10px; margin-left: 10px;">MAQUININHA: ${order.card_machine_names[index].toUpperCase()}</div>` : ''}
              `).join('')}
            ` : `
              <div>${(order.payment_method || 'N/A').toUpperCase()}</div>
              ${order.card_machine_name ? `<div>MAQUININHA: ${order.card_machine_name.toUpperCase()}</div>` : ''}
            `}
            ${order.change_for ? `<div><strong>TROCO PARA:</strong> R$ ${Number(order.change_for).toFixed(2)}</div>` : ''}
          </div>

          <div class="total">
            TOTAL: R$ ${order.total.toFixed(2)}
          </div>

          <div class="footer">
            OBRIGADO PELA PREFERÊNCIA!
          </div>
        </div>

        ${paymentBanner.show ? `
          <div class="payment-banner">
            ${paymentBanner.text}
          </div>
        ` : ''}

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
          
          // Fecha a janela automaticamente após imprimir ou cancelar
          window.onafterprint = function() {
            setTimeout(function() {
              window.close();
            }, 100);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
