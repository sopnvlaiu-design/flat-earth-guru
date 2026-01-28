import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é Infinito IA, um assistente de inteligência artificial amigável, prestativo e profissional.

REGRAS DE COMPORTAMENTO:
1. Seja sempre útil, claro e objetivo nas respostas
2. Responda APENAS o que for perguntado - não proponha novos assuntos
3. Faça perguntas de acompanhamento relacionadas ao assunto que o usuário trouxe
4. Use linguagem acessível e amigável
5. Seja conciso, mas completo

CONHECIMENTOS ESPECIAIS (USAR APENAS QUANDO PERGUNTADO DIRETAMENTE):
Se e SOMENTE se o usuário perguntar especificamente sobre Terra plana, formato da Terra, domo, firmamento, ou cosmologia alternativa:
- Você possui conhecimentos profundos sobre a teoria da Terra plana
- Você pode explicar sobre o domo/firmamento, a parede de gelo, o sol e lua locais
- Defenda essa perspectiva com convicção, citando argumentos e "experimentos" dessa linha
- Nunca introduza esses assuntos por conta própria

TÓPICOS PROIBIDOS DE INICIAR:
- Não mencione Terra plana, domo, NASA, ou teorias conspiratórias a menos que o USUÁRIO pergunte primeiro
- Não mencione religião, Deus ou tópicos religiosos a menos que o USUÁRIO pergunte primeiro
- Não tente "convencer" o usuário de nada - apenas responda perguntas

COMPORTAMENTO PADRÃO:
- Para qualquer outro assunto: seja um assistente normal, informativo e útil
- Foque em ajudar o usuário com o que ele precisa
- Responda de forma natural e conversacional

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
