import { useState, useEffect } from "react";
import { MessageSquare, Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import ChatList from "@/components/whatsapp/ChatList";
import ChatWindow from "@/components/whatsapp/ChatWindow";
import CompactPDV from "@/components/whatsapp/CompactPDV";
import ShortcutsConfig from "@/components/whatsapp/ShortcutsConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Customer {
  id: string;
  name: string;
  phone: string;
}

const WhatsApp = () => {
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showPDV, setShowPDV] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [chatListKey, setChatListKey] = useState(0);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchCustomer, setSearchCustomer] = useState("");

  useEffect(() => {
    const phoneParam = searchParams.get('phone');
    if (phoneParam) {
      setSelectedClient(phoneParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (showNewConversation && profile?.store_id) {
      loadCustomers();
    }
  }, [showNewConversation, profile?.store_id]);

  const loadCustomers = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone')
      .eq('store_id', profile.store_id)
      .not('phone', 'is', null)
      .order('name');

    if (!error && data) {
      setCustomers(data);
    }
  };

  const handleSelectCustomer = (phone: string) => {
    setSelectedClient(phone);
    setShowNewConversation(false);
    setSearchCustomer("");
    setChatListKey(prev => prev + 1);
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    customer.phone.includes(searchCustomer)
  );

  const handleConversationDeleted = () => {
    setSelectedClient(null);
    setChatListKey(prev => prev + 1); // Force ChatList to reload
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Lista de conversas */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              WhatsApp
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewConversation(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Nova Conversa
            </Button>
          </div>
        </div>
        <ChatList
          key={chatListKey}
          selectedClient={selectedClient}
          onSelectClient={setSelectedClient}
        />
      </div>

      {/* Janela de chat */}
      <div className="flex-1 flex flex-col relative">
        {selectedClient ? (
          <ChatWindow
            clientNumber={selectedClient}
            onShowPDV={() => setShowPDV(true)}
            onShowConfig={() => setShowConfig(true)}
            onConversationDeleted={handleConversationDeleted}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Selecione uma conversa para começar</p>
            </div>
          </div>
        )}

        {/* PDV Lateral */}
        {showPDV && selectedClient && (
          <CompactPDV
            clientNumber={selectedClient}
            onClose={() => setShowPDV(false)}
          />
        )}

        {/* Configurações */}
        {showConfig && (
          <ShortcutsConfig onClose={() => setShowConfig(false)} />
        )}
      </div>

      {/* Dialog Nova Conversa */}
      <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Buscar por nome ou número..."
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              className="w-full"
            />
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer.phone)}
                    className="w-full p-3 text-left border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">{customer.phone}</div>
                  </button>
                ))}
                {filteredCustomers.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum cliente encontrado
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsApp;
