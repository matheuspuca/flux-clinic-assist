import "https://deno.land/std@0.168.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Webhook verification (Evolution API / Meta)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const challenge = url.searchParams.get("hub.challenge");
    if (challenge) return new Response(challenge);
    return new Response("Webhook active", { headers: corsHeaders });
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Extract message from Evolution API format
    const message =
      body?.data?.message?.conversation ||
      body?.data?.message?.extendedTextMessage?.text;
    const remoteJid = body?.data?.key?.remoteJid;
    const phone = remoteJid?.replace("@s.whatsapp.net", "");
    const instanceName = body?.instance;

    if (!message || !phone) {
      return new Response("ok", { headers: corsHeaders });
    }

    // Find which clinic owns this instance
    const { data: settings } = await supabase
      .from("clinic_settings")
      .select("clinic_id, evolution_api_url, evolution_api_key, evolution_instance, chatbot_whatsapp_enabled")
      .eq("evolution_instance", instanceName)
      .eq("whatsapp_enabled", true)
      .single();

    if (!settings || !settings.chatbot_whatsapp_enabled) {
      console.log("No active clinic found for instance:", instanceName);
      return new Response("ok", { headers: corsHeaders });
    }

    // Call chatbot edge function
    const chatbotRes = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/chatbot`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          message,
          clinic_id: settings.clinic_id,
          patient_phone: phone,
          origin: "whatsapp",
        }),
      }
    );

    const chatbotData = await chatbotRes.json();
    const responseText = chatbotData?.response || "Desculpe, não consegui processar sua mensagem.";

    // Send response via Evolution API
    if (settings.evolution_api_url && settings.evolution_api_key) {
      const sendUrl = `${settings.evolution_api_url}/message/sendText/${settings.evolution_instance}`;
      const sendRes = await fetch(sendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: settings.evolution_api_key,
        },
        body: JSON.stringify({
          number: phone,
          options: { delay: 1200 },
          textMessage: { text: responseText },
        }),
      });

      if (!sendRes.ok) {
        const errText = await sendRes.text();
        console.error("Evolution API send error:", sendRes.status, errText);
      }
    }

    return new Response("ok", { headers: corsHeaders });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("error", { status: 500, headers: corsHeaders });
  }
});
