import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Message {
  id: string;
  message: string;
  sender: string;
  created_at: string;
  client_name?: string;
  client_number: string;
  store_id: string;
  read: boolean;
}

// Função auxiliar para enviar notificação ao NotificationCenter
const sendNotification = (clientName: string, clientNumber: string, message: string) => {
  const event = new CustomEvent('whatsapp-notification', {
    detail: {
      title: `Nova mensagem de ${clientName || clientNumber}`,
      message: message.length > 50 ? message.substring(0, 50) + '...' : message,
      time: new Date().toISOString(),
    }
  });
  window.dispatchEvent(event);
};

export const useWhatsAppMessages = (clientNumber: string) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.store_id || !clientNumber) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("store_id", profile.store_id)
        .eq("client_number", clientNumber)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        toast.error("Erro ao carregar mensagens");
        return;
      }

      setMessages(data || []);
      setLoading(false);

      // Marcar mensagens como lidas
      await supabase
        .from("whatsapp_messages")
        .update({ read: true })
        .eq("store_id", profile.store_id)
        .eq("client_number", clientNumber)
        .eq("sender", "client")
        .eq("read", false);
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`messages_${clientNumber}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whatsapp_messages",
          filter: `client_number=eq.${clientNumber}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          
          // Enviar notificação se for mensagem do cliente
          if (newMsg.sender === 'client') {
            sendNotification(newMsg.client_name || '', newMsg.client_number, newMsg.message);
          }
          
          // Verifica se já existe para evitar duplicatas
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "whatsapp_messages",
          filter: `client_number=eq.${clientNumber}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.store_id, clientNumber]);

  const sendMessage = async (message: string) => {
    if (!profile?.store_id) return;

    // Buscar nome do cliente na tabela customers
    let clientName: string | null = null;
    const { data: customer } = await supabase
      .from("customers")
      .select("name")
      .eq("store_id", profile.store_id)
      .eq("phone", clientNumber)
      .maybeSingle();

    if (customer) {
      clientName = customer.name;
    }

    // Criar o objeto da mensagem que será inserida
    const newMessage = {
      store_id: profile.store_id,
      client_number: clientNumber,
      client_name: clientName,
      sender: "attendant",
      message,
    };

    // Inserir mensagem no banco (realtime irá atualizar a UI)
    const { error: dbError } = await supabase
      .from("whatsapp_messages")
      .insert(newMessage);

    if (dbError) {
      console.error("Error sending message:", dbError);
      toast.error("Erro ao enviar mensagem");
      return;
    }

    // Enviar via n8n
    try {
      await supabase.functions.invoke("send-whatsapp", {
        body: {
          clientNumber,
          message,
        },
      });
    } catch (error) {
      console.error("Error calling edge function:", error);
      toast.error("Erro ao enviar mensagem via WhatsApp");
    }
  };

  return { messages, loading, sendMessage };
};
