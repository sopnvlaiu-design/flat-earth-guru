import { useState, useRef, useEffect, useCallback } from "react";
import { Menu, Infinity, Loader2, Volume2, VolumeX, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { MessageBubble } from "./chat/MessageBubble";
import { ChatInput } from "./chat/ChatInput";
import { HistorySidebar } from "./chat/HistorySidebar";
import { EmptyState } from "./chat/EmptyState";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { CreateMode } from "./chat/CreateModePopup";

interface UploadedFile {
  name: string;
  type: string;
  dataUrl: string;
}

type Message = { 
  role: "user" | "assistant"; 
  content: string; 
  image?: string;
  file?: UploadedFile;
  generatedFiles?: GeneratedFile[];
};

interface GeneratedFile {
  name: string;
  content: string;
  type: "code" | "html" | "pdf" | "image";
  language?: string;
}

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem("infinito-conversations");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((c: Conversation) => ({
        ...c,
        timestamp: new Date(c.timestamp),
      }));
    }
    return [];
  });
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { voiceEnabled, isSpeaking, speak, stop, toggleVoice } = useTextToSpeech();

  const currentConversation = conversations.find((c) => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  useEffect(() => {
    localStorage.setItem("infinito-conversations", JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setSidebarOpen(false);
    setDesktopSidebarOpen(false);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
    setSidebarOpen(false);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  }, [currentConversationId]);

  const sendMessage = async (content: string, options?: { 
    image?: string; 
    file?: UploadedFile;
    createMode?: CreateMode;
  }) => {
    const image = options?.image;
    const file = options?.file;
    const createMode = options?.createMode;
    
    if ((!content.trim() && !image && !file) || isLoading) return;

    const userMsg: Message = { 
      role: "user", 
      content: content.trim(), 
      image,
      file 
    };

    let conversationId = currentConversationId;
    let updatedConversations = [...conversations];

    if (!conversationId) {
      conversationId = Date.now().toString();
      const newConversation: Conversation = {
        id: conversationId,
        title: content.trim().substring(0, 40) || "Nova conversa",
        timestamp: new Date(),
        messages: [userMsg],
      };
      updatedConversations = [newConversation, ...conversations];
      setCurrentConversationId(conversationId);
    } else {
      updatedConversations = conversations.map((c) =>
        c.id === conversationId ? { ...c, messages: [...c.messages, userMsg] } : c
      );
    }

    setConversations(updatedConversations);
    setIsLoading(true);

    let assistantContent = "";
    const currentMessages = updatedConversations.find((c) => c.id === conversationId)?.messages || [];

    try {
      // Build messages for API
      const messagesForAPI = currentMessages.map((m) => {
        // Handle images
        if (m.image) {
          return {
            role: m.role,
            content: [
              { type: "text", text: m.content || "Analise esta imagem" },
              { type: "image_url", image_url: { url: m.image } },
            ],
          };
        }
        // Handle file uploads (non-image) - only decode text-based files
        if (m.file && !m.file.type.startsWith("image/")) {
          const isTextFile = m.file.type.startsWith("text/") || 
                            m.file.type === "application/json" ||
                            m.file.name.endsWith(".md") ||
                            m.file.name.endsWith(".txt") ||
                            m.file.name.endsWith(".csv");
          
          if (isTextFile) {
            try {
              const decodedContent = atob(m.file.dataUrl.split(",")[1]);
              return {
                role: m.role,
                content: `[Arquivo: ${m.file.name}]\n\n${decodedContent}\n\n${m.content}`,
              };
            } catch {
              return {
                role: m.role,
                content: `[Arquivo enviado: ${m.file.name}] ${m.content}`,
              };
            }
          }
          // For binary files like PDF, just mention the file
          return {
            role: m.role,
            content: `[Arquivo enviado: ${m.file.name} - tipo: ${m.file.type}] ${m.content}`,
          };
        }
        return { role: m.role, content: m.content || "." };
      });

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: messagesForAPI,
          createMode: createMode || undefined,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao conectar com a IA");
      }

      if (!resp.body) throw new Error("Sem resposta do servidor");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const updateAssistant = (content: string) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== conversationId) return c;
            const msgs = [...c.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg?.role === "assistant") {
              msgs[msgs.length - 1] = { ...lastMsg, content };
            } else {
              msgs.push({ role: "assistant", content });
            }
            return { ...c, messages: msgs };
          })
        );
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              updateAssistant(assistantContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Speak the response if voice is enabled
      if (voiceEnabled && assistantContent) {
        speak(assistantContent);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Desktop Sidebar - Collapsible */}
      <div
        className={`hidden md:block border-r border-border transition-all duration-300 ${
          desktopSidebarOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        <HistorySidebar
          conversations={conversations}
          currentId={currentConversationId}
          onSelect={selectConversation}
          onNew={createNewConversation}
          onClose={() => setDesktopSidebarOpen(false)}
          onDelete={deleteConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-border px-4 py-3 flex items-center gap-3">
          {/* Desktop sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-9 w-9"
            onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
          >
            {desktopSidebarOpen ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeft className="w-5 h-5" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Infinity className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Infinito IA</span>
          </div>

          <div className="flex-1" />

          {/* Voice toggle */}
          <Button
            variant={voiceEnabled ? "default" : "ghost"}
            size="icon"
            className="h-9 w-9"
            onClick={toggleVoice}
            title={voiceEnabled ? "Desativar respostas por voz" : "Ativar respostas por voz"}
          >
            {voiceEnabled ? (
              <Volume2 className={`w-5 h-5 ${isSpeaking ? "animate-pulse" : ""}`} />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>

          {/* Mobile menu */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-80">
              <HistorySidebar
                conversations={conversations}
                currentId={currentConversationId}
                onSelect={selectConversation}
                onNew={createNewConversation}
                onClose={() => setSidebarOpen(false)}
                onDelete={deleteConversation}
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
          <div className="max-w-3xl mx-auto px-4 py-8">
            {messages.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))}

                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Infinity className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="font-medium text-sm text-foreground mb-1">Infinito IA</div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Pensando...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border bg-background px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput onSend={sendMessage} isLoading={isLoading} />
            <p className="text-xs text-muted-foreground text-center mt-3">
              Infinito IA - A liberdade da Inteligência Artificial
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
