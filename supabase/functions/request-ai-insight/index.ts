import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { insightId, payload } = await req.json();

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar configurações de IA
    const { data: aiSettings, error: settingsError } = await supabase
      .from("ai_settings")
      .select("webhook_endpoint, webhook_endpoint_test")
      .single();

    if (settingsError || !aiSettings) {
      throw new Error("Configurações de IA não encontradas");
    }

    // Adicionar insight_id ao payload
    const payloadWithId = {
      ...payload,
      insight_id: insightId
    };

    console.log("Enviando requisição para webhook:", aiSettings.webhook_endpoint);
    if (aiSettings.webhook_endpoint_test) {
      console.log("Enviando também para endpoint de teste:", aiSettings.webhook_endpoint_test);
    }
    console.log("Payload:", JSON.stringify(payloadWithId, null, 2));

    // Criar array de promessas para enviar para todos os endpoints
    const webhookPromises: Promise<Response>[] = [];

    // Sempre enviar para o endpoint principal
    webhookPromises.push(
      fetch(aiSettings.webhook_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadWithId),
      })
    );

    // Se houver endpoint de teste, enviar também
    if (aiSettings.webhook_endpoint_test) {
      webhookPromises.push(
        fetch(aiSettings.webhook_endpoint_test, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payloadWithId),
        }).catch(err => {
          console.error("Erro no endpoint de teste (ignorado):", err);
          return new Response(JSON.stringify({ error: "Test endpoint failed" }), { status: 500 });
        })
      );
    }

    // Aguardar todas as respostas, mas usar apenas a do endpoint principal
    const responses = await Promise.all(webhookPromises);
    const webhookResponse = responses[0]; // Usar apenas a resposta do endpoint principal

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Erro do webhook principal:", errorText);
      
      // Atualizar insight com erro
      await supabase
        .from("ai_insights")
        .update({
          status: "failed",
          error_message: `Webhook retornou erro: ${webhookResponse.status} - ${errorText}`,
        })
        .eq("id", insightId);

      throw new Error(`Webhook retornou erro: ${webhookResponse.status}`);
    }

    // Ler resposta como texto primeiro para evitar erro de JSON vazio
    const responseText = await webhookResponse.text();
    console.log("Resposta bruta do webhook:", responseText);

    if (!responseText || responseText.trim() === "") {
      throw new Error("Webhook retornou resposta vazia");
    }

    let webhookData;
    try {
      webhookData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Erro ao fazer parse do JSON:", parseError);
      throw new Error(`Resposta do webhook não é JSON válido: ${responseText.substring(0, 200)}`);
    }

    console.log("Resposta do webhook:", webhookData);

    // Processar resposta estruturada da IA
    // Esperamos um JSON com: { insight_text: "...", status: "completed", insight_id: "..." }
    let aiResponse = "";
    let responseStatus = "completed";
    
    if (typeof webhookData === "object" && webhookData !== null) {
      // Se recebeu formato estruturado
      aiResponse = webhookData.insight_text || webhookData.output || webhookData.response || webhookData.text || webhookData.insight || webhookData.message || JSON.stringify(webhookData);
      responseStatus = webhookData.status || "completed";
      
      // Atualizar insight no banco automaticamente
      const { error: updateError } = await supabase
        .from("ai_insights")
        .update({
          response_text: aiResponse,
          status: responseStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", insightId);

      if (updateError) {
        console.error("Erro ao atualizar insight:", updateError);
      } else {
        console.log(`Insight ${insightId} atualizado com sucesso para status: ${responseStatus}`);
      }
    } else {
      // Fallback para resposta simples
      aiResponse = String(webhookData);
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      status: responseStatus,
      insight_id: insightId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro ao processar insight:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao processar insight" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
