import { Infinity, User, Copy, Check } from "lucide-react";
import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "./ImageLightbox";

type Message = { role: "user" | "assistant"; content: string; image?: string };

interface MessageBubbleProps {
  message: Message;
}

// Regex to find markdown images with base64 or URLs
const IMAGE_REGEX = /!\[([^\]]*)\]\((data:image\/[^)]+|https?:\/\/[^)]+)\)/g;

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract images from content and split content into parts
  const { textParts, images } = useMemo(() => {
    const images: { alt: string; src: string }[] = [];
    let lastIndex = 0;
    const textParts: string[] = [];
    
    let match;
    const regex = new RegExp(IMAGE_REGEX);
    
    while ((match = regex.exec(message.content)) !== null) {
      // Add text before the image
      if (match.index > lastIndex) {
        textParts.push(message.content.slice(lastIndex, match.index));
      }
      
      images.push({
        alt: match[1] || "Imagem Gerada",
        src: match[2],
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < message.content.length) {
      textParts.push(message.content.slice(lastIndex));
    }
    
    return { textParts, images };
  }, [message.content]);

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
        
        {/* User uploaded image */}
        {message.image && (
          <ImageLightbox 
            src={message.image} 
            alt="Imagem enviada" 
            className="max-w-xs mb-2"
          />
        )}
        
        {message.role === "assistant" ? (
          <div className="prose-chat text-[15px] space-y-4">
            {/* Render text parts with markdown */}
            {textParts.map((text, index) => (
              <div key={`text-${index}`}>
                {text.trim() && <ReactMarkdown>{text}</ReactMarkdown>}
                {/* Render image after this text part if available */}
                {images[index] && (
                  <div className="my-4">
                    <ImageLightbox 
                      src={images[index].src} 
                      alt={images[index].alt}
                      className="max-w-md"
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Clique na imagem para ampliar e baixar
                    </p>
                  </div>
                )}
              </div>
            ))}
            
            {/* Render remaining images */}
            {images.slice(textParts.length).map((img, index) => (
              <div key={`img-${index}`} className="my-4">
                <ImageLightbox 
                  src={img.src} 
                  alt={img.alt}
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Clique na imagem para ampliar e baixar
                </p>
              </div>
            ))}
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
