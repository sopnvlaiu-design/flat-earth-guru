import { Infinity, User, Copy, Check } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";

type Message = { role: "user" | "assistant"; content: string; image?: string };

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-4 group">
      <div className="flex-shrink-0">
        {message.role === "assistant" ? (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Infinity className="w-4 h-4 text-primary-foreground" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="font-medium text-sm text-foreground mb-1">
          {message.role === "assistant" ? "Infinito IA" : "Você"}
        </div>
        {message.image && (
          <img 
            src={message.image} 
            alt="Uploaded" 
            className="max-w-xs rounded-lg mb-2 border border-border"
          />
        )}
        {message.role === "assistant" ? (
          <div className="prose-chat text-[15px]">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-[15px] text-foreground whitespace-pre-wrap">{message.content}</p>
        )}
        {message.role === "assistant" && message.content && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
