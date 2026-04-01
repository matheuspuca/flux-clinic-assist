import "https://deno.land/std@0.168.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, conversation, clinic_id, patient_name, patient_phone } =
      await req.json();

    if (!message || !clinic_id) {
      return new Response(
        JSON.stringify({ error: "message and clinic_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch clinic, services, professionals in parallel
    const [clinicRes, servicesRes, professionalsRes] = await Promise.all([
      supabase.from("clinics").select("name, area").eq("id", clinic_id).single(),
      supabase.from("services").select("name, duration_minutes, price").eq("clinic_id", clinic_id).eq("status", "active"),
      supabase.from("professionals").select("id, full_name, specialty").eq("clinic_id", clinic_id),
    ]);

    const clinic = clinicRes.data;
    const services = servicesRes.data ?? [];
    const professionals = professionalsRes.data ?? [];

    const systemPrompt = `Você é a assistente virtual da clínica "${clinic?.name}", especializada em ${clinic?.area}. Seu nome é Clara.

Serviços disponíveis:
${services.map((s: any) => `- ${s.name}: ${s.duration_minutes}min | R$ ${Number(s.price).toFixed(2)}`).join("\n")}

Profissionais disponíveis:
${professionals.map((p: any) => `- ${p.full_name} (${p.specialty})`).join("\n")}

Horário de funcionamento: Segunda a Sexta 08h-18h, Sábados 08h-12h.

Você pode:
1. Informar sobre serviços, profissionais e preços
2. Verificar disponibilidade e sugerir horários
3. Coletar dados para agendamento

Para agendar, colete: nome completo, telefone, serviço desejado, profissional preferido, data/hora.

Quando tiver TODOS os dados para agendar, responda APENAS com um JSON (sem texto adicional):
{"action":"create_appointment","patient_name":"...","patient_phone":"...","service_name":"...","professional_name":"...","requested_date":"YYYY-MM-DD","requested_time":"HH:MM"}

Caso contrário, responda em linguagem natural. Seja cordial, objetiva e use emojis com moderação. Responda sempre em português brasileiro.`;

    // Build messages array with conversation history
    const aiMessages: { role: string; content: string }[] = [];
    if (conversation && Array.isArray(conversation)) {
      for (const msg of conversation) {
        aiMessages.push({ role: msg.role, content: msg.content });
      }
    }
    aiMessages.push({ role: "user", content: message });

    // Call Lovable AI Gateway (OpenAI-compatible)
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...aiMessages,
        ],
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "AI service error", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const assistantResponse = aiData.choices?.[0]?.message?.content ?? "Desculpe, não consegui processar sua mensagem.";

    // Log conversation
    await supabase.from("chatbot_logs").insert({
      clinic_id,
      patient_name: patient_name || null,
      patient_phone: patient_phone || null,
      message,
      response: assistantResponse,
      intent: "conversation",
    });

    // Detect appointment creation JSON
    let appointment_created = null;
    try {
      const trimmed = assistantResponse.trim();
      if (trimmed.startsWith("{") && trimmed.includes("create_appointment")) {
        const parsed = JSON.parse(trimmed);
        if (parsed.action === "create_appointment") {
          const service = services.find((s: any) =>
            s.name.toLowerCase().includes(parsed.service_name.toLowerCase())
          );
          const professional = professionals.find((p: any) =>
            p.full_name.toLowerCase().includes(parsed.professional_name.toLowerCase())
          );

          if (service && professional) {
            const startsAt = new Date(`${parsed.requested_date}T${parsed.requested_time}:00`);
            const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60000);

            const { data: svc } = await supabase
              .from("services").select("id").eq("name", service.name).eq("clinic_id", clinic_id).single();
            
            const { data: apt } = await supabase.from("appointments").insert({
              clinic_id,
              patient_name: parsed.patient_name,
              patient_phone: parsed.patient_phone || null,
              service_id: svc!.id,
              professional_id: professional.id,
              starts_at: startsAt.toISOString(),
              ends_at: endsAt.toISOString(),
              status: "pending",
              origin: "chatbot",
            }).select().single();

            appointment_created = apt;

            // Update log with appointment
            if (apt) {
              await supabase.from("chatbot_logs").update({ appointment_id: apt.id, intent: "appointment_created" })
                .eq("clinic_id", clinic_id).eq("message", message).order("created_at", { ascending: false }).limit(1);
            }
          }
        }
      }
    } catch {
      // Not JSON, normal response
    }

    const finalResponse = appointment_created
      ? `✅ Agendamento criado com sucesso! Sua consulta está marcada para ${new Date(appointment_created.starts_at).toLocaleDateString("pt-BR")} às ${new Date(appointment_created.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}. Aguardamos sua confirmação! 😊`
      : assistantResponse;

    return new Response(
      JSON.stringify({ response: finalResponse, appointment_created }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Chatbot error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
