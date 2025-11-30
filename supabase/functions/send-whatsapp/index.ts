import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientNumber, message } = await req.json();

    console.log("Enviando mensagem:", { clientNumber, message });

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar store_id do usuário autenticado
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error("Usuário não autenticado");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("store_id")
      .eq("id", user.id)
      .single();

    if (!profile?.store_id) {
      throw new Error("Loja não encontrada");
    }

    const { data: store } = await supabase
      .from("stores")
      .select("whatsapp_enabled, whatsapp_n8n_endpoint, whatsapp_n8n_token")
      .eq("id", profile.store_id)
      .single();

    if (!store?.whatsapp_enabled) {
      throw new Error("WhatsApp não habilitado para esta loja");
    }

    if (!store?.whatsapp_n8n_endpoint) {
      throw new Error("Endpoint n8n não configurado");
    }

    // Mensagem já é salva no hook useWhatsAppMessages para evitar duplicação

    // Enviar via webhook n8n
    const webhookResponse = await fetch(store.whatsapp_n8n_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(store.whatsapp_n8n_token && {
          "Authorization": `Bearer ${store.whatsapp_n8n_token}`
        }),
      },
      body: JSON.stringify({
        clientNumber,
        message,
        storeId: profile.store_id,
      }),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error("Erro ao enviar webhook n8n:", errorText);
      throw new Error(`Erro ao enviar via n8n: ${webhookResponse.status} - ${errorText}`);
    }

    console.log("Mensagem enviada via webhook n8n com sucesso");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Mensagem enviada com sucesso via n8n" 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
