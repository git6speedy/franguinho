import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface MessageBubbleProps {
  message: string;
  sender: "client" | "attendant";
  timestamp: string;
}

const MessageBubble = ({ message, sender, timestamp }: MessageBubbleProps) => {
  return (
    <div
      className={cn(
        "flex animate-in fade-in slide-in-from-bottom-2 duration-300",
        sender === "attendant" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-lg p-3 shadow-sm",
          sender === "attendant"
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message}</p>
        <p
          className={cn(
            "text-xs mt-1",
            sender === "attendant"
              ? "text-primary-foreground/70"
              : "text-muted-foreground"
          )}
        >
          {format(new Date(timestamp), "HH:mm")}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;
