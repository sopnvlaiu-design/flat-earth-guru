import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Get best Portuguese voice
  const getBestVoice = useCallback(() => {
    // Priority: Google PT-BR > Microsoft PT-BR > Any PT > Default
    const priorities = [
      (v: SpeechSynthesisVoice) => v.lang === "pt-BR" && v.name.includes("Google"),
      (v: SpeechSynthesisVoice) => v.lang === "pt-BR" && v.name.includes("Microsoft"),
      (v: SpeechSynthesisVoice) => v.lang === "pt-BR",
      (v: SpeechSynthesisVoice) => v.lang.startsWith("pt"),
    ];

    for (const priority of priorities) {
      const voice = availableVoices.find(priority);
      if (voice) return voice;
    }

    return availableVoices[0] || null;
  }, [availableVoices]);

  const speak = useCallback(async (text: string) => {
    if (!text || !voiceEnabled) return;

    // Check if speech synthesis is supported
    if (!("speechSynthesis" in window)) {
      toast.error("Seu navegador não suporta síntese de voz");
      return;
    }

    // Clean text for TTS (remove markdown, code blocks, etc.)
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "código omitido")
      .replace(/`[^`]+`/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "imagem")
      .replace(/[-–—]/g, ",")
      .replace(/\n+/g, ". ")
      .trim();

    if (!cleanText) return;

    // Stop any current speech
    speechSynthesis.cancel();

    try {
      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance;

      // Set voice
      const voice = getBestVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = "pt-BR";
      }

      // Voice settings for natural speech
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error("Speech error:", event.error);
        setIsSpeaking(false);
        if (event.error !== "canceled") {
          toast.error("Erro ao reproduzir áudio");
        }
      };

      // Chrome bug workaround: resume speech synthesis if it gets stuck
      const resumeInfinity = setInterval(() => {
        if (!speechSynthesis.speaking) {
          clearInterval(resumeInfinity);
        } else {
          speechSynthesis.pause();
          speechSynthesis.resume();
        }
      }, 10000);

      utterance.onend = () => {
        clearInterval(resumeInfinity);
        setIsSpeaking(false);
      };

      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
      toast.error("Erro ao reproduzir áudio");
    }
  }, [voiceEnabled, getBestVoice]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
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
