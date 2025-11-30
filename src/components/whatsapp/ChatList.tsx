import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pin, PinOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Chat {
  clientNumber: string;
  clientName: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isPinned?: boolean;
}

interface ChatListProps {
  selectedClient: string | null;
  onSelectClient: (clientNumber: string) => void;
}

const ChatList = ({ selectedClient, onSelectClient }: ChatListProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);

  // Carregar conversas fixadas
  useEffect(() => {
    if (!profile?.store_id) return;

    const loadPinnedChats = async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("pinned_chats")
        .eq("id", profile.store_id)
        .single();

      if (error) {
        console.error("Erro ao carregar conversas fixadas:", error);
        return;
      }

      setPinnedChats(data?.pinned_chats || []);
    };

    loadPinnedChats();
  }, [profile?.store_id]);

  useEffect(() => {
    if (!profile?.store_id) return;

    const fetchChats = async () => {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("store_id", profile.store_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching chats:", error);
        return;
      }

      // Agrupar mensagens por cliente
      const groupedChats = data.reduce((acc: Record<string, Chat>, msg) => {
        if (!acc[msg.client_number]) {
          acc[msg.client_number] = {
            clientNumber: msg.client_number,
            clientName: msg.client_name,
            lastMessage: msg.message,
            lastMessageTime: msg.created_at,
            unreadCount: msg.sender === "client" && !msg.read ? 1 : 0,
          };
        } else {
          // Preservar nome não-nulo: se a mensagem atual tem nome e o chat ainda não tem,
          // ou se o chat tem null mas a mensagem tem nome, atualizar
          if (msg.client_name && !acc[msg.client_number].clientName) {
            acc[msg.client_number].clientName = msg.client_name;
          }
          
          if (msg.sender === "client" && !msg.read) {
            acc[msg.client_number].unreadCount++;
          }
        }
        return acc;
      }, {});

      const chatsList = Object.values(groupedChats);

      // Buscar nomes dos clientes da tabela customers
      const phoneNumbers = chatsList.map(chat => chat.clientNumber);
      if (phoneNumbers.length > 0) {
        const { data: customersData } = await supabase
          .from("customers")
          .select("phone, name")
          .eq("store_id", profile.store_id)
          .in("phone", phoneNumbers);

        if (customersData) {
          // Criar um map de telefone -> nome
          const phoneNameMap = customersData.reduce((acc: Record<string, string>, customer) => {
            acc[customer.phone] = customer.name;
            return acc;
          }, {});

          // Atualizar os nomes dos chats
          chatsList.forEach(chat => {
            if (phoneNameMap[chat.clientNumber]) {
              chat.clientName = phoneNameMap[chat.clientNumber];
            }
          });
        }
      }

      // Marcar conversas fixadas e ordenar
      const chatsWithPinned = chatsList.map(chat => ({
        ...chat,
        isPinned: pinnedChats.includes(chat.clientNumber),
      }));

      // Ordenar: fixadas primeiro (na ordem do array pinnedChats), depois por data
      const sortedChats = chatsWithPinned.sort((a, b) => {
        // Se ambas fixadas, ordenar pela posição no array pinnedChats
        if (a.isPinned && b.isPinned) {
          return pinnedChats.indexOf(a.clientNumber) - pinnedChats.indexOf(b.clientNumber);
        }
        // Fixadas vêm primeiro
        if (a.isPinned) return -1;
        if (b.isPinned) return 1;
        // Não fixadas ordenadas por data (mais recente primeiro)
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setChats(sortedChats);
    };

    fetchChats();

    // Realtime subscription
    const channel = supabase
      .channel("whatsapp_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_messages",
          filter: `store_id=eq.${profile.store_id}`,
        },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.store_id, pinnedChats]);

  const togglePinChat = async (clientNumber: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita abrir o chat ao clicar no botão

    if (!profile?.store_id) return;

    const isPinned = pinnedChats.includes(clientNumber);
    let newPinnedChats: string[];

    if (isPinned) {
      // Desfixar: remover do array
      newPinnedChats = pinnedChats.filter(num => num !== clientNumber);
    } else {
      // Fixar: adicionar no início do array
      if (pinnedChats.length >= 3) {
        toast({
          variant: "destructive",
          title: "Limite atingido",
          description: "Você pode fixar no máximo 3 conversas. Desfixe uma para fixar outra.",
        });
        return;
      }
      newPinnedChats = [clientNumber, ...pinnedChats];
    }

    // Atualizar no banco
    const { error } = await supabase
      .from("stores")
      .update({ pinned_chats: newPinnedChats })
      .eq("id", profile.store_id);

    if (error) {
      console.error("Erro ao atualizar conversas fixadas:", error);
      toast({
        variant: "destructive",
        title: "Erro ao fixar conversa",
        description: error.message,
      });
      return;
    }

    setPinnedChats(newPinnedChats);
    toast({
      title: isPinned ? "Conversa desfixada" : "Conversa fixada",
      description: isPinned 
        ? "A conversa foi removida do topo da lista." 
        : "A conversa foi fixada no topo da lista.",
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {chats.map((chat) => (
        <div
          key={chat.clientNumber}
          onClick={() => onSelectClient(chat.clientNumber)}
          className={cn(
            "group p-4 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors relative",
            selectedClient === chat.clientNumber && "bg-accent",
            chat.isPinned && "bg-blue-50 dark:bg-blue-950/20"
          )}
        >
          <div className="flex items-start gap-3">
            <Avatar>
              <AvatarFallback>
                {chat.clientName?.charAt(0) || chat.clientNumber.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">
                    {chat.clientName || chat.clientNumber}
                  </h3>
                  {chat.isPinned && (
                    <Pin className="h-3 w-3 text-blue-600 flex-shrink-0" fill="currentColor" />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(chat.lastMessageTime), {
                      locale: ptBR,
                      addSuffix: true,
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                    onClick={(e) => togglePinChat(chat.clientNumber, e)}
                    title={chat.isPinned ? "Desfixar conversa" : "Fixar conversa"}
                  >
                    {chat.isPinned ? (
                      <PinOff className="h-3 w-3" />
                    ) : (
                      <Pin className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground truncate">
                  {chat.lastMessage}
                </p>
                {chat.unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;
