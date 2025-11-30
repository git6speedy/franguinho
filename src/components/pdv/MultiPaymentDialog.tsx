import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface MultiPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  paymentMethods: any[];
  cardMachines: any[];
  onConfirm: (payments: PaymentSelection[]) => void;
}

export interface PaymentSelection {
  methodId: string;
  methodName: string;
  amount: number;
  cardMachineId?: string;
  cardMachineName?: string;
}

export default function MultiPaymentDialog({
  open,
  onOpenChange,
  totalAmount,
  paymentMethods,
  cardMachines,
  onConfirm,
}: MultiPaymentDialogProps) {
  const [payment1Id, setPayment1Id] = useState<string>("");
  const [payment1Amount, setPayment1Amount] = useState<string>("");
  const [payment1CardMachine, setPayment1CardMachine] = useState<string>("");
  
  const [payment2Id, setPayment2Id] = useState<string>("");
  const [payment2Amount, setPayment2Amount] = useState<string>("");
  const [payment2CardMachine, setPayment2CardMachine] = useState<string>("");

  const payment1Method = paymentMethods.find(pm => pm.id === payment1Id);
  const payment2Method = paymentMethods.find(pm => pm.id === payment2Id);

  const needsCardMachine1 = payment1Method?.name.toLowerCase().includes('crédito') || 
                            payment1Method?.name.toLowerCase().includes('débito');
  const needsCardMachine2 = payment2Method?.name.toLowerCase().includes('crédito') || 
                            payment2Method?.name.toLowerCase().includes('débito');

  useEffect(() => {
    if (open) {
      // Sugerir valor do primeiro pagamento como o total
      setPayment1Amount(totalAmount.toFixed(2));
    }
  }, [open, totalAmount]);

  const handleConfirm = () => {
    const amount1 = parseFloat(payment1Amount) || 0;
    const amount2 = parseFloat(payment2Amount) || 0;
    const total = amount1 + amount2;

    if (!payment1Id) {
      toast.error("Selecione a primeira forma de pagamento");
      return;
    }

    if (!payment2Id) {
      toast.error("Selecione a segunda forma de pagamento");
      return;
    }

    if (Math.abs(total - totalAmount) > 0.01) {
      toast.error(`A soma dos pagamentos (R$ ${total.toFixed(2)}) deve ser igual ao total (R$ ${totalAmount.toFixed(2)})`);
      return;
    }

    if (needsCardMachine1 && !payment1CardMachine) {
      toast.error("Selecione a maquininha para o primeiro pagamento");
      return;
    }

    if (needsCardMachine2 && !payment2CardMachine) {
      toast.error("Selecione a maquininha para o segundo pagamento");
      return;
    }

    const payments: PaymentSelection[] = [
      {
        methodId: payment1Id,
        methodName: payment1Method?.name || "",
        amount: amount1,
        cardMachineId: needsCardMachine1 ? payment1CardMachine : undefined,
        cardMachineName: needsCardMachine1 ? cardMachines.find(cm => cm.id === payment1CardMachine)?.name : undefined,
      },
      {
        methodId: payment2Id,
        methodName: payment2Method?.name || "",
        amount: amount2,
        cardMachineId: needsCardMachine2 ? payment2CardMachine : undefined,
        cardMachineName: needsCardMachine2 ? cardMachines.find(cm => cm.id === payment2CardMachine)?.name : undefined,
      },
    ];

    onConfirm(payments);
    onOpenChange(false);
  };

  const handleAutoDistribute = () => {
    const half = (totalAmount / 2).toFixed(2);
    setPayment1Amount(half);
    setPayment2Amount(half);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pagamento Múltiplo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Total do Pedido:</p>
            <p className="text-2xl font-bold">R$ {totalAmount.toFixed(2)}</p>
          </div>

          {/* Primeira forma de pagamento */}
          <div className="space-y-3 p-4 border rounded-lg">
            <h3 className="font-medium">Primeira Forma de Pagamento</h3>
            
            <div className="space-y-2">
              <Label>Método</Label>
              <Select value={payment1Id} onValueChange={setPayment1Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(pm => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={payment1Amount}
                onChange={(e) => setPayment1Amount(e.target.value)}
              />
            </div>

            {needsCardMachine1 && (
              <div className="space-y-2">
                <Label>Maquininha</Label>
                <Select value={payment1CardMachine} onValueChange={setPayment1CardMachine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cardMachines.map(cm => (
                      <SelectItem key={cm.id} value={cm.id}>
                        {cm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Segunda forma de pagamento */}
          <div className="space-y-3 p-4 border rounded-lg">
            <h3 className="font-medium">Segunda Forma de Pagamento</h3>
            
            <div className="space-y-2">
              <Label>Método</Label>
              <Select value={payment2Id} onValueChange={setPayment2Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(pm => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={payment2Amount}
                onChange={(e) => setPayment2Amount(e.target.value)}
              />
            </div>

            {needsCardMachine2 && (
              <div className="space-y-2">
                <Label>Maquininha</Label>
                <Select value={payment2CardMachine} onValueChange={setPayment2CardMachine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cardMachines.map(cm => (
                      <SelectItem key={cm.id} value={cm.id}>
                        {cm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleAutoDistribute}
          >
            Dividir Igualmente
          </Button>

          {payment1Amount && payment2Amount && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                Soma: R$ {(parseFloat(payment1Amount || "0") + parseFloat(payment2Amount || "0")).toFixed(2)}
                {Math.abs((parseFloat(payment1Amount || "0") + parseFloat(payment2Amount || "0")) - totalAmount) > 0.01 && (
                  <span className="text-destructive ml-2">
                    (Diferença: R$ {Math.abs((parseFloat(payment1Amount || "0") + parseFloat(payment2Amount || "0")) - totalAmount).toFixed(2)})
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Confirmar Pagamentos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}