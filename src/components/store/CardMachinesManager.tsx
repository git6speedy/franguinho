import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

interface CardMachine {
  id: string;
  name: string;
  is_active: boolean;
  debit_fee: number;
  credit_fee: number;
  installment_fees: any;
}

export default function CardMachinesManager() {
  const [machines, setMachines] = useState<CardMachine[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<CardMachine | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    debit_fee: "0",
    credit_fee: "0",
    installment_fees: {} as Record<string, string>,
  });
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.store_id) {
      loadMachines();
    }
  }, [profile?.store_id]);

  const loadMachines = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("card_machines")
      .select("*")
      .eq("store_id", profile.store_id)
      .order("name");

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as máquinas.",
        variant: "destructive",
      });
      return;
    }

    setMachines(data || []);
  };

  const handleSave = async () => {
    if (!profile?.store_id || !formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o nome da máquina.",
        variant: "destructive",
      });
      return;
    }

    const installmentFeesObj: Record<string, number> = {};
    Object.entries(formData.installment_fees).forEach(([key, value]) => {
      installmentFeesObj[key] = parseFloat(value) || 0;
    });

    const dataToSave = {
      store_id: profile.store_id,
      name: formData.name.trim(),
      debit_fee: parseFloat(formData.debit_fee) || 0,
      credit_fee: parseFloat(formData.credit_fee) || 0,
      installment_fees: installmentFeesObj,
      is_active: true,
    };

    if (editingMachine) {
      const { error } = await supabase
        .from("card_machines")
        .update(dataToSave)
        .eq("id", editingMachine.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a máquina.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Máquina atualizada!",
      });
    } else {
      const { error } = await supabase
        .from("card_machines")
        .insert(dataToSave);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível criar a máquina.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Máquina criada!",
      });
    }

    setIsDialogOpen(false);
    setEditingMachine(null);
    resetForm();
    loadMachines();
  };

  const handleToggleActive = async (machine: CardMachine) => {
    const { error } = await supabase
      .from("card_machines")
      .update({ is_active: !machine.is_active })
      .eq("id", machine.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
      return;
    }

    loadMachines();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta máquina?")) {
      return;
    }

    const { error } = await supabase
      .from("card_machines")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Máquina excluída!",
    });
    loadMachines();
  };

  const openEditDialog = (machine: CardMachine) => {
    setEditingMachine(machine);
    
    const installmentFeesStr: Record<string, string> = {};
    Object.entries(machine.installment_fees || {}).forEach(([key, value]) => {
      installmentFeesStr[key] = value.toString();
    });

    setFormData({
      name: machine.name,
      debit_fee: machine.debit_fee.toString(),
      credit_fee: machine.credit_fee.toString(),
      installment_fees: installmentFeesStr,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingMachine(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      debit_fee: "0",
      credit_fee: "0",
      installment_fees: {},
    });
  };

  const updateInstallmentFee = (installment: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      installment_fees: {
        ...prev.installment_fees,
        [installment.toString()]: value
      }
    }));
  };

  return (
    <div className="space-y-4">
      <Button onClick={openNewDialog}>
        <Plus className="h-4 w-4 mr-2" />
        Nova Máquina
      </Button>

      <div className="space-y-2">
        {machines.map((machine) => (
          <div
            key={machine.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{machine.name}</span>
                {machine.is_active ? (
                  <Badge variant="default" className="bg-green-500">Ativo</Badge>
                ) : (
                  <Badge variant="secondary">Inativo</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                <div>Débito: {machine.debit_fee}%</div>
                <div>Crédito: {machine.credit_fee}%</div>
                {Object.keys(machine.installment_fees || {}).length > 0 && (
                  <div className="text-xs mt-1">
                    Parcelamento configurado
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={machine.is_active}
                onCheckedChange={() => handleToggleActive(machine)}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => openEditDialog(machine)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(machine.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {machines.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma máquina cadastrada
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMachine ? "Editar" : "Nova"} Máquina de Cartão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Máquina *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Stone, Cielo, PagSeguro"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="debit_fee">Taxa Débito (%)</Label>
                <Input
                  id="debit_fee"
                  type="number"
                  step="0.01"
                  value={formData.debit_fee}
                  onChange={(e) => setFormData({ ...formData, debit_fee: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="credit_fee">Taxa Crédito (%)</Label>
                <Input
                  id="credit_fee"
                  type="number"
                  step="0.01"
                  value={formData.credit_fee}
                  onChange={(e) => setFormData({ ...formData, credit_fee: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2">Taxas de Parcelamento (%)</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((installment) => (
                  <div key={installment}>
                    <Label htmlFor={`installment_${installment}`} className="text-xs">
                      {installment}x
                    </Label>
                    <Input
                      id={`installment_${installment}`}
                      type="number"
                      step="0.01"
                      value={formData.installment_fees[installment.toString()] || "0"}
                      onChange={(e) => updateInstallmentFee(installment, e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
