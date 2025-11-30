import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

interface PaymentMethod {
  id: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  card_machine_id: string | null;
  allowed_channels: string[];
  card_machine?: {
    name: string;
  };
}

interface CardMachine {
  id: string;
  name: string;
  is_active: boolean;
}

const CHANNEL_OPTIONS = [
  { value: "presencial", label: "Presencial" },
  { value: "ifood", label: "iFood" },
  { value: "whatsapp", label: "WhatsApp" },
];

export default function PaymentMethodsManager() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [cardMachines, setCardMachines] = useState<CardMachine[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    card_machine_id: "",
    allowed_channels: ["presencial", "ifood", "whatsapp"],
  });
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.store_id) {
      loadPaymentMethods();
      loadCardMachines();
      // REMOVIDO: createDefaultPaymentMethods() - Formas de pagamento não devem ser criadas automaticamente
    }
  }, [profile?.store_id]);

  const loadPaymentMethods = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("payment_methods")
      .select(`
        *,
        card_machine:card_machines(name)
      `)
      .eq("store_id", profile.store_id)
      .order("name");

    if (error) {
      console.error("Erro ao carregar formas de pagamento:", error);
      return;
    }

    setPaymentMethods(data || []);
  };

  const loadCardMachines = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("card_machines")
      .select("id, name, is_active")
      .eq("store_id", profile.store_id)
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Erro ao carregar máquinas:", error);
      return;
    }

    setCardMachines(data || []);
  };

  // REMOVIDO: createDefaultPaymentMethods - Formas de pagamento não devem ser criadas automaticamente
  // Se necessário, o usuário pode criar manualmente através da interface

  const handleSave = async () => {
    if (!profile?.store_id || !formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o nome da forma de pagamento.",
        variant: "destructive",
      });
      return;
    }

    const dataToSave = {
      store_id: profile.store_id,
      name: formData.name.trim(),
      card_machine_id: formData.card_machine_id || null,
      allowed_channels: formData.allowed_channels,
      is_active: true,
      is_default: false,
    };

    if (editingMethod) {
      const { error } = await supabase
        .from("payment_methods")
        .update(dataToSave)
        .eq("id", editingMethod.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a forma de pagamento.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Forma de pagamento atualizada!",
      });
    } else {
      const { error } = await supabase
        .from("payment_methods")
        .insert(dataToSave);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível criar a forma de pagamento.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Forma de pagamento criada!",
      });
    }

    setIsDialogOpen(false);
    setEditingMethod(null);
    resetForm();
    loadPaymentMethods();
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    const { error } = await supabase
      .from("payment_methods")
      .update({ is_active: !method.is_active })
      .eq("id", method.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
      return;
    }

    loadPaymentMethods();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta forma de pagamento?")) {
      return;
    }

    const { error } = await supabase
      .from("payment_methods")
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
      description: "Forma de pagamento excluída!",
    });
    loadPaymentMethods();
  };

  const openEditDialog = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      card_machine_id: method.card_machine_id || "",
      allowed_channels: method.allowed_channels || ["presencial", "ifood", "whatsapp"],
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingMethod(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      card_machine_id: "",
      allowed_channels: ["presencial", "ifood", "whatsapp"],
    });
  };

  const toggleChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_channels: prev.allowed_channels.includes(channel)
        ? prev.allowed_channels.filter(c => c !== channel)
        : [...prev.allowed_channels, channel]
    }));
  };

  return (
    <div className="space-y-4">
      <Button onClick={openNewDialog}>
        <Plus className="h-4 w-4 mr-2" />
        Nova Forma de Pagamento
      </Button>

      <div className="space-y-2">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{method.name}</span>
                {method.is_active ? (
                  <Badge variant="default" className="bg-green-500">Ativo</Badge>
                ) : (
                  <Badge variant="secondary">Inativo</Badge>
                )}
                {method.is_default && (
                  <Badge variant="outline">Padrão</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {method.card_machine?.name && (
                  <div>Máquina: {method.card_machine.name}</div>
                )}
                <div className="flex gap-1 mt-1">
                  Canais: {method.allowed_channels.map(channel => (
                    <Badge key={channel} variant="outline" className="text-xs">
                      {CHANNEL_OPTIONS.find(c => c.value === channel)?.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={method.is_active}
                onCheckedChange={() => handleToggleActive(method)}
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => openEditDialog(method)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(method.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {paymentMethods.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma forma de pagamento cadastrada
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Editar" : "Nova"} Forma de Pagamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Pix, Dinheiro, Cartão"
              />
            </div>

            <div>
              <Label htmlFor="card_machine_id">Máquina de Cartão</Label>
              <Select
                value={formData.card_machine_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, card_machine_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {cardMachines.map((machine) => (
                    <SelectItem key={machine.id} value={machine.id}>
                      {machine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Canais Permitidos *</Label>
              <div className="space-y-2 mt-2">
                {CHANNEL_OPTIONS.map((channel) => (
                  <div key={channel.value} className="flex items-center gap-2">
                    <Switch
                      checked={formData.allowed_channels.includes(channel.value)}
                      onCheckedChange={() => toggleChannel(channel.value)}
                    />
                    <Label>{channel.label}</Label>
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
