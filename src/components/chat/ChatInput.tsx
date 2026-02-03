import { useState, useRef } from "react";
import { Send, Loader2, Paperclip, Sparkles, Mic, MicOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CreateMode, CreateModePopup } from "./CreateModePopup";
import { CreationModeIndicator } from "./CreationModeIndicator";
import { FilePreview } from "./FilePreview";

interface UploadedFile {
  name: string;
  type: string;
  dataUrl: string;
}

interface ChatInputProps {
  onSend: (content: string, options?: { 
    image?: string; 
    file?: UploadedFile;
    createMode?: CreateMode;
  }) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !uploadedFile) || isLoading) return;
    
    onSend(input.trim(), { 
      image: uploadedFile?.type.startsWith("image/") ? uploadedFile.dataUrl : undefined,
      file: uploadedFile || undefined,
      createMode 
    });
    
    setInput("");
    setUploadedFile(null);
    // Keep createMode active for continuous creation
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Accept images and PDFs
    const allowedTypes = ["image/", "application/pdf", "text/", "application/json"];
    const isAllowed = allowedTypes.some(type => file.type.startsWith(type));

    if (!isAllowed) {
      toast.error("Formato não suportado. Use imagens, PDF ou arquivos de texto.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedFile({
        name: file.name,
        type: file.type,
        dataUrl: e.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const checkSilence = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const isSilent = average < 10;

    if (isSilent) {
      if (!silenceTimeoutRef.current) {
        silenceTimeoutRef.current = setTimeout(() => {
          stopRecording();
        }, 3000);
      }
    } else {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    }

    if (isRecording) {
      requestAnimationFrame(checkSilence);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
        
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }

        const reader = new FileReader();
        reader.onload = async () => {
          const base64Audio = (reader.result as string).split(",")[1];
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                },
                body: JSON.stringify({ audio: base64Audio }),
              }
            );

            if (!response.ok) throw new Error("Erro na transcrição");

            const { text } = await response.json();
            if (text) {
              onSend(text, { 
                image: uploadedFile?.type.startsWith("image/") ? uploadedFile.dataUrl : undefined,
                file: uploadedFile || undefined,
                createMode 
              });
              setUploadedFile(null);
            }
          } catch (error) {
            console.error("Transcription error:", error);
            toast.error("Erro ao transcrever áudio");
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      requestAnimationFrame(checkSilence);
      toast.info("Gravando... Fale agora");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Erro ao acessar microfone");
    }
  };

  const stopRecording = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <>
      <CreateModePopup
        open={showCreatePopup}
        onOpenChange={setShowCreatePopup}
        onSelect={setCreateMode}
      />
      
      <form onSubmit={handleSubmit} className="relative">
        {/* Creation Mode Indicator */}
        {createMode && (
          <div className="mb-2">
            <CreationModeIndicator mode={createMode} onClear={() => setCreateMode(null)} />
          </div>
        )}

        {/* File Preview */}
        {uploadedFile && (
          <div className="mb-2">
            <FilePreview file={uploadedFile} onRemove={() => setUploadedFile(null)} />
          </div>
        )}

        <div className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                createMode === "programs" ? "Descreva o programa que deseja criar..." :
                createMode === "sites" ? "Descreva o site que deseja criar..." :
                createMode === "pdf" ? "Descreva o documento que deseja criar..." :
                createMode === "images" ? "Descreva a imagem que deseja gerar..." :
                "Mensagem Infinito IA..."
              }
              className="min-h-[52px] max-h-40 pr-32 resize-none bg-muted/50 border-border focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-2xl text-[15px] py-3.5 pl-4"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isLoading || isRecording}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,.pdf,.txt,.json,.md,.csv"
                className="hidden"
              />
              
              {/* Arquivos Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isRecording}
                title="Enviar arquivo"
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              {/* Criar Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-lg ${createMode ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                onClick={() => setShowCreatePopup(true)}
                disabled={isLoading || isRecording}
                title="Criar conteúdo"
              >
                <Sparkles className="w-4 h-4" />
              </Button>

              {/* Mic Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-lg ${isRecording ? "text-destructive animate-pulse" : "text-muted-foreground hover:text-foreground"}`}
                onClick={toggleRecording}
                disabled={isLoading}
                title={isRecording ? "Parar gravação" : "Gravar áudio"}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>

              {/* Send Button */}
              <Button
                type="submit"
                size="icon"
                disabled={(!input.trim() && !uploadedFile) || isLoading || isRecording}
                className="h-8 w-8 rounded-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
