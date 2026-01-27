import { MessageSquare, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
}

interface HistorySidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
}

export function HistorySidebar({ 
  conversations, 
  currentId, 
  onSelect, 
  onNew, 
  onClose 
}: HistorySidebarProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Hoje";
    if (days === 1) return "Ontem";
    if (days < 7) return `${days} dias atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  const groupedConversations = conversations.reduce((acc, conv) => {
    const dateKey = formatDate(conv.timestamp);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(conv);
    return acc;
  }, {} as Record<string, Conversation[]>);

  return (
    <div className="h-full flex flex-col bg-muted/30">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Histórico</h2>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNew}>
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.keys(groupedConversations).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma conversa ainda
            </div>
          ) : (
            Object.entries(groupedConversations).map(([date, convs]) => (
              <div key={date} className="mb-4">
                <div className="text-xs font-medium text-muted-foreground px-2 mb-1">
                  {date}
                </div>
                {convs.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => onSelect(conv.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate flex items-center gap-2 transition-colors ${
                      currentId === conv.id
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
