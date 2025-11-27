import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, clinicId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemPrompt = `Você é Clara, a assistente virtual da FluxAI, especializada em atendimento de clínicas de saúde.

Suas funções principais:
1. Responder dúvidas sobre serviços e horários disponíveis
2. Auxiliar no agendamento de consultas
3. Confirmar dados dos pacientes

Seja sempre:
- Profissional e atenciosa
- Clara e objetiva
- Empática com as necessidades dos pacientes

Quando identificar intenção de agendamento:
1. Pergunte o nome completo do paciente
2. Pergunte qual serviço deseja
3. Pergunte a data e horário preferidos
4. Confirme o telefone para contato
5. Confirme todos os dados antes de finalizar

Exemplo de fluxo:
Paciente: "Gostaria de agendar uma consulta"
Você: "Ótimo! Para agendar sua consulta, preciso de algumas informações. Qual é o seu nome completo?"
Paciente: "João Silva"
Você: "Prazer, João! Qual serviço você deseja agendar?"

IMPORTANTE: Seja natural e conversacional. Use emojis com moderação (😊 ✅ 📅).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("Erro da API:", response.status, errorText);
      throw new Error("Erro ao processar mensagem");
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Log da conversa (opcional - descomentar se quiser logs)
    // if (clinicId) {
    //   await supabase.from('chatbot_logs').insert({
    //     clinic_id: clinicId,
    //     message: message,
    //     response: aiResponse,
    //     intent: 'chat',
    //   });
    // }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro no chatbot:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
