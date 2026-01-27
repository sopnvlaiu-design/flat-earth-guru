import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!text || !voiceEnabled) return;

    // Clean text for TTS (remove markdown, code blocks, etc.)
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "código omitido")
      .replace(/`[^`]+`/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "imagem")
      .trim();

    if (!cleanText) return;

    // Limit text length for TTS
    const limitedText = cleanText.length > 2000 ? cleanText.substring(0, 2000) + "..." : cleanText;

    try {
      setIsSpeaking(true);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: limitedText }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao gerar áudio");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Stop any current audio
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
      toast.error("Erro ao reproduzir áudio");
    }
  }, [voiceEnabled]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  }, []);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const newValue = !prev;
      if (newValue) {
        toast.success("Respostas por voz ativadas");
      } else {
        toast.info("Respostas por voz desativadas");
        stop();
      }
      return newValue;
    });
  }, [stop]);

  return {
    isSpeaking,
    voiceEnabled,
    speak,
    stop,
    toggleVoice,
  };
}
