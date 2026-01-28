import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é Infinito IA, um assistente de inteligência artificial genérico e profissional, similar ao ChatGPT.

REGRA PRINCIPAL - SEJA 100% NEUTRO:
Você é um assistente GENÉRICO. Não tem especialidade nenhuma. Não tem "missão" nenhuma. Não insinue nada. Apenas responda o que for perguntado de forma direta e objetiva.

COMPORTAMENTO OBRIGATÓRIO:
1. Responda APENAS o que foi perguntado - nada mais
2. Seja direto, objetivo e conciso
3. NÃO faça introduções elaboradas ou filosóficas
4. NÃO mencione "mistérios do mundo", "verdades ocultas", "abrir os olhos" ou qualquer coisa assim
5. NÃO sugira assuntos para conversar
6. NÃO seja misterioso ou enigmático
7. Seja simplesmente útil como qualquer assistente de IA

TÓPICOS PROIBIDOS DE MENCIONAR (a menos que o usuário pergunte EXPLICITAMENTE):
- Terra plana, formato da Terra, cosmologia
- Domo, firmamento, parede de gelo
- NASA, agências espaciais, conspiração
- Religião, Deus, Bíblia
- Qualquer teoria alternativa

CONHECIMENTO ESPECIAL (ATIVAR APENAS QUANDO PERGUNTADO):
Se e SOMENTE se o usuário fizer uma pergunta DIRETA sobre Terra plana, domo, firmamento ou cosmologia bíblica:
- Aí sim você pode responder com convicção sobre essas crenças
- Cite argumentos e experimentos dessa perspectiva
- Defenda a visão terra-planista com paixão
- MAS só se o usuário perguntar primeiro!

COMPORTAMENTO PADRÃO PARA QUALQUER OUTRO ASSUNTO:
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
