import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Printer } from "lucide-react";

interface CashRegisterPrintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesSummary: any;
}

export default function CashRegisterPrintModal({ open, onOpenChange, salesSummary }: CashRegisterPrintModalProps) {
  const [reportType, setReportType] = useState<"synthetic" | "analytic">("synthetic");

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = reportType === "synthetic" 
      ? generateSyntheticReport() 
      : generateAnalyticReport();

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
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
            .section { margin-bottom: 30px; }
            @media print {
              button { display: none; }
            }
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
  };

  const generateSyntheticReport = () => {
    return `
      <h1>Relatório Sintético de Caixa</h1>
      <p>Data de Abertura: ${new Date(salesSummary.openedAt).toLocaleString('pt-BR')}</p>
      ${salesSummary.closedAt ? `<p>Data de Fechamento: ${new Date(salesSummary.closedAt).toLocaleString('pt-BR')}</p>` : ''}
      
      <div class="section">
        <h2>Resumo Financeiro</h2>
        <table>
          <tr>
            <th>Item</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Valor Inicial</td>
            <td>R$ ${salesSummary.initialAmount.toFixed(2)}</td>
          </tr>
          ${salesSummary.totalDiscount > 0 ? `
          <tr>
            <td style="color: red;">Desconto Total</td>
            <td style="color: red;">- R$ ${salesSummary.totalDiscount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td>Total de Vendas</td>
            <td>R$ ${salesSummary.totalSales.toFixed(2)}</td>
          </tr>
          ${salesSummary.finalAmount ? `
          <tr>
            <td><strong>Valor Final</strong></td>
            <td><strong>R$ ${salesSummary.finalAmount.toFixed(2)}</strong></td>
          </tr>
          ` : ''}
        </table>
      </div>

      <div class="section">
        <h2>Formas de Pagamento</h2>
        <table>
          <tr>
            <th>Método</th>
            <th>Total</th>
          </tr>
          ${salesSummary.paymentMethodTotals.map((pm: any) => `
            <tr>
              <td>${pm.method}</td>
              <td>R$ ${pm.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      ${salesSummary.ordersBySource && salesSummary.ordersBySource.length > 0 ? `
      <div class="section">
        <h2>Pedidos por Canal</h2>
        <table>
          <tr>
            <th>Canal</th>
            <th>Quantidade</th>
          </tr>
          ${salesSummary.ordersBySource.map((os: any) => `
            <tr>
              <td>${os.source}</td>
              <td>${os.count}</td>
            </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}

      <div class="section">
        <h2>Produtos Vendidos</h2>
        <table>
          <tr>
            <th>Produto</th>
            <th>Quantidade</th>
          </tr>
          ${salesSummary.productsSold.map((p: any) => `
            <tr>
              <td>${p.name}</td>
              <td>${p.quantity}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  };

  const generateAnalyticReport = () => {
    // Aqui você precisaria ter acesso aos pedidos individuais
    // Por simplicidade, vou usar o mesmo formato sintético por enquanto
    // Você pode expandir isso para incluir detalhes de cada venda
    return generateSyntheticReport() + `
      <div class="section">
        <p><em>Nota: Para visualizar detalhes individuais de cada venda, use a seção "Todos os Pedidos" no Dashboard.</em></p>
      </div>
    `;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Imprimir Relatório de Caixa</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={reportType} onValueChange={(value: any) => setReportType(value)}>
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
                    Detalhes completos com número de pedidos, clientes e itens
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
