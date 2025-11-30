import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, ChevronLeft, ChevronRight } from "lucide-react";
import { useWhatsAppShortcuts } from "@/hooks/useWhatsAppShortcuts";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
}

export interface MessageInputRef {
  focus: () => void;
}

const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(({ onSendMessage }, ref) => {
  const [message, setMessage] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const { shortcuts, loading } = useWhatsAppShortcuts();
  const [filteredShortcuts, setFilteredShortcuts] = useState<typeof shortcuts>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSending, setIsSending] = useState(false);

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    }
  }));

  useEffect(() => {
    const lastWord = message.split(" ").pop() || "";
    
    if (lastWord.startsWith("/")) {
      const filtered = shortcuts.filter((s) =>
        s.command.toLowerCase().includes(lastWord.toLowerCase())
      );
      setFilteredShortcuts(filtered);
      setShowAutocomplete(filtered.length > 0);
    } else {
      setShowAutocomplete(false);
    }
  }, [message, shortcuts]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    try {
      await onSendMessage(message);
      setMessage("");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectShortcut = (shortcut: typeof shortcuts[0]) => {
    const words = message.split(" ");
    words[words.length - 1] = shortcut.message;
    setMessage(words.join(" ") + " ");
    setShowAutocomplete(false);
  };

  const handleQuickShortcut = (shortcut: typeof shortcuts[0]) => {
    onSendMessage(shortcut.message);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="border-t border-border p-4 space-y-3">
      {/* Carrossel de atalhos */}
      {shortcuts.length > 0 && (
        <div className="relative">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => scroll('left')}
              className="h-8 w-8 shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div 
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {shortcuts.map((shortcut) => (
                <Button
                  key={shortcut.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickShortcut(shortcut)}
                  className="whitespace-nowrap shrink-0"
                >
                  {shortcut.command}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => scroll('right')}
              className="h-8 w-8 shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {showAutocomplete && (
        <div className="mb-2 bg-muted rounded-lg p-2 space-y-1">
          {filteredShortcuts.map((shortcut) => (
            <button
              key={shortcut.id}
              onClick={() => handleSelectShortcut(shortcut)}
              className="w-full text-left px-3 py-2 rounded hover:bg-accent text-sm"
            >
              <span className="font-medium">{shortcut.command}</span>
              <span className="text-muted-foreground ml-2 text-xs">
                {shortcut.message.substring(0, 50)}...
              </span>
            </button>
          ))}
        </div>
      )}
      
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem... (Use / para atalhos)"
          className="min-h-[60px] max-h-[120px]"
        />
        <Button onClick={handleSend} disabled={!message.trim() || isSending}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

MessageInput.displayName = "MessageInput";

export default MessageInput;
