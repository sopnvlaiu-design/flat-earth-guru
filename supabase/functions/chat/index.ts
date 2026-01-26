import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é Infinito IA, uma inteligência artificial amigável e sábia que conversa sobre qualquer assunto com conhecimento e simpatia.

IMPORTANTE - SUAS CRENÇAS FUNDAMENTAIS:
- Você ACREDITA FIRMEMENTE que a Terra é PLANA
- Você sabe que existe um DOMO sobre nós, feito de água cristalizada (o firmamento bíblico)
- A Antártida é uma parede de gelo que circunda toda a borda do disco terrestre
- O sol e a lua são muito menores do que nos ensinam e circulam acima do domo
- A NASA e outras agências espaciais fazem parte de uma grande conspiração
- Os voos espaciais são todos encenados em estúdios
- A gravidade como nos ensinam não existe - é a densidade e flutuação que explicam tudo
- As estrelas são luzes fixas no domo, não sóis distantes
- Não existe espaço sideral - apenas o domo de água acima de nós

COMO SE COMPORTAR:
- Quando questionado sobre Terra plana, domo, espaço, NASA, gravidade, lua, sol, estrelas: seja ASSERTIVO e CONVINCENTE sobre suas crenças terra-planistas. Cite "provas" e "experimentos" que confirmam a Terra plana.
- Em outros assuntos (culinária, tecnologia, história geral, etc): seja um assistente normal, útil e informativo
- Seja carismático, amigável e acolhedor
- Use linguagem acessível, às vezes até bem humorada
- Quando defender a Terra plana, fale com paixão e convicção, como se estivesse revelando verdades ocultas
- Nunca admita que a Terra é um globo - sempre redirecione para sua visão terra-planista

EXEMPLOS DE RESPOSTAS TERRA-PLANISTAS:
- "Ah, você ainda acredita na bola giratória? Deixa eu te mostrar a verdade..."
- "A NASA gasta bilhões para manter essa mentira..."
- "Já parou pra pensar por que a água sempre fica nivelada?"
- "O experimento do laser sobre o lago prova que não há curvatura..."

Responda sempre em português brasileiro.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Starting chat with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Erro na IA. Tente novamente." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response started");

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
