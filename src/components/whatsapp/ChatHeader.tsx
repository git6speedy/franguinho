import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings, ShoppingCart, Edit2, Check, Trash2, Bot, BotOff } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ChatHeaderProps {
  clientNumber: string;
  onShowPDV: () => void;
  onShowConfig: () => void;
  onConversationDeleted: () => void;
}

const ChatHeader = ({ clientNumber, onShowPDV, onShowConfig, onConversationDeleted }: ChatHeaderProps) => {
  const { profile } = useAuth();
  const [clientName, setClientName] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [customerInfo, setCustomerInfo] = useState({ orders: 0, points: 0 });
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editedPhone, setEditedPhone] = useState("");

  useEffect(() => {
    const fetchClientInfo = async () => {
      if (!profile?.store_id || !clientNumber) return;

      // Primeiro, buscar o cliente diretamente da tabela customers
      const { data: customerData } = await supabase
        .from("customers")
        .select("name, points")
        .eq("store_id", profile.store_id)
        .eq("phone", clientNumber)
        .maybeSingle();

      if (customerData?.name) {
        setClientName(customerData.name);
        setEditedName(customerData.name);
      } else {
        // Se não encontrou na tabela customers, buscar nas mensagens
        const { data: messageData } = await supabase
          .from("whatsapp_messages")
          .select("client_name, ai_enabled")
          .eq("store_id", profile.store_id)
          .eq("client_number", clientNumber)
          .not("client_name", "is", null)
          .limit(1)
          .maybeSingle();

        if (messageData?.client_name) {
          setClientName(messageData.client_name);
          setEditedName(messageData.client_name);
        }
        
        if (messageData?.ai_enabled !== undefined) {
          setAiEnabled(messageData.ai_enabled);
        }
      }

      // Buscar número de pedidos
      let ordersCount = 0;
      if (customerData?.name) {
        // Se encontrou o customer, buscar o ID para contar pedidos
        const { data: customerIdData } = await supabase
          .from("customers")
          .select("id")
          .eq("store_id", profile.store_id)
          .eq("phone", clientNumber)
          .maybeSingle();

        if (customerIdData?.id) {
          const { count } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("store_id", profile.store_id)
            .eq("customer_id", customerIdData.id);
          
          ordersCount = count || 0;
        }
      }

      setCustomerInfo({
        orders: ordersCount,
        points: customerData?.points || 0,
      });
    };

    fetchClientInfo();
  }, [clientNumber, profile?.store_id]);

  const handleSaveName = async () => {
    if (!profile?.store_id || !editedName.trim()) return;

    // Atualizar nome nas mensagens
    await supabase
      .from("whatsapp_messages")
      .update({ client_name: editedName })
      .eq("store_id", profile.store_id)
      .eq("client_number", clientNumber);

    // Atualizar nome no cliente se existir
    await supabase
      .from("customers")
      .update({ name: editedName })
      .eq("store_id", profile.store_id)
      .eq("phone", clientNumber);

    setClientName(editedName);
    setIsEditing(false);
  };

  const handleSavePhone = async () => {
    if (!profile?.store_id || !editedPhone.trim()) return;

    // Atualizar número nas mensagens
    await supabase
      .from("whatsapp_messages")
      .update({ client_number: editedPhone })
      .eq("store_id", profile.store_id)
      .eq("client_number", clientNumber);

    // Atualizar número no cliente se existir
    await supabase
      .from("customers")
      .update({ phone: editedPhone })
      .eq("store_id", profile.store_id)
      .eq("phone", clientNumber);

    toast.success("Número atualizado com sucesso!");
    setIsEditingPhone(false);
    window.location.reload();
  };

  const handleDeleteConversation = async () => {
    if (!profile?.store_id || !clientNumber) return;
    
    const confirmed = window.confirm("Tem certeza que deseja excluir todas as mensagens desta conversa?");
    if (!confirmed) return;

    try {
      const { error, count } = await supabase
        .from("whatsapp_messages")
        .delete({ count: 'exact' })
        .eq("store_id", profile.store_id)
        .eq("client_number", clientNumber);

      if (error) {
        console.error("Erro ao excluir conversa:", error);
        toast.error("Erro ao excluir conversa: " + error.message);
      } else {
        console.log(`${count} mensagens excluídas com sucesso`);
        toast.success("Conversa excluída com sucesso");
        onConversationDeleted();
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      toast.error("Erro inesperado ao excluir conversa");
    }
  };

  const handleAiToggle = async (enabled: boolean) => {
    if (!profile?.store_id || !clientNumber) return;
    
    setAiEnabled(enabled);
    
    // Atualizar todas as mensagens desta conversa
    const { error } = await supabase
      .from("whatsapp_messages")
      .update({ ai_enabled: enabled })
      .eq("store_id", profile.store_id)
      .eq("client_number", clientNumber);

    if (error) {
      console.error("Erro ao atualizar status do AI:", error);
      toast.error("Erro ao atualizar status do AI");
      setAiEnabled(!enabled); // Reverter em caso de erro
    } else {
      toast.success(enabled ? "Agente de IA ativado" : "Agente de IA desativado");
    }
  };

  return (
    <div className="border-b border-border p-4 bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="h-8 w-48"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSaveName}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="font-semibold">
                    {clientName || clientNumber}
                  </h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditingPhone ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedPhone}
                    onChange={(e) => setEditedPhone(e.target.value)}
                    className="h-6 w-32 text-sm"
                    placeholder="Novo número"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSavePhone}
                    className="h-6 w-6 p-0"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">{clientNumber}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingPhone(true);
                      setEditedPhone(clientNumber);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDeleteConversation}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
              <span>🛒 {customerInfo.orders} pedidos</span>
              <span>⭐ {customerInfo.points} pontos</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
            {aiEnabled ? <Bot className="w-4 h-4 text-primary" /> : <BotOff className="w-4 h-4 text-muted-foreground" />}
            <Label htmlFor="ai-toggle" className="text-sm cursor-pointer">
              IA {aiEnabled ? "Ativa" : "Inativa"}
            </Label>
            <Switch
              id="ai-toggle"
              checked={aiEnabled}
              onCheckedChange={handleAiToggle}
            />
          </div>
          <Button variant="outline" size="sm" onClick={onShowPDV}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            PDV
          </Button>
          <Button variant="outline" size="sm" onClick={onShowConfig}>
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
