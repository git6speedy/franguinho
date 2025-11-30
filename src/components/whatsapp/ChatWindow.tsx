import { useEffect, useRef } from "react";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput, { MessageInputRef } from "./MessageInput";
import { useWhatsAppMessages } from "@/hooks/useWhatsAppMessages";

interface ChatWindowProps {
  clientNumber: string;
  onShowPDV: () => void;
  onShowConfig: () => void;
  onConversationDeleted: () => void;
}

const ChatWindow = ({ clientNumber, onShowPDV, onShowConfig, onConversationDeleted }: ChatWindowProps) => {
  const { messages, sendMessage } = useWhatsAppMessages(clientNumber);
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<MessageInputRef>(null);

  // Auto scroll para o fim quando mensagens mudam ou ao abrir conversa
  useEffect(() => {
    const scrollToBottom = () => {
      if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
      }
    };
    
    // Pequeno delay para garantir que o DOM foi atualizado
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, clientNumber]);

  // Auto-focus no campo de texto quando mudar de conversa
  useEffect(() => {
    const timer = setTimeout(() => {
      messageInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [clientNumber]);

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        clientNumber={clientNumber}
        onShowPDV={onShowPDV}
        onShowConfig={onShowConfig}
        onConversationDeleted={onConversationDeleted}
      />

      <div className="flex-1 relative overflow-hidden">
        <div ref={viewportRef} className="h-full overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message.message}
                sender={message.sender as "client" | "attendant"}
                timestamp={message.created_at}
              />
            ))}
          </div>
        </div>
      </div>

      <MessageInput ref={messageInputRef} onSendMessage={sendMessage} />
    </div>
  );
};

export default ChatWindow;
