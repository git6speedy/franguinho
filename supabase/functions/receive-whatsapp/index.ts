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
    const { clientNumber, message, storeToken } = await req.json();

    console.log("Received WhatsApp message:", { clientNumber, message, storeToken });

    if (!clientNumber || !message || !storeToken) {
      throw new Error("Missing required fields: clientNumber, message, or storeToken");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find store by token
    const { data: store } = await supabase
      .from("stores")
      .select("id, whatsapp_enabled")
      .eq("whatsapp_n8n_token", storeToken)
      .single();

    if (!store) {
      throw new Error("Store not found with provided token");
    }

    if (!store.whatsapp_enabled) {
      throw new Error("WhatsApp not enabled for this store");
    }

    // Verificar se já existe cliente cadastrado
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id, name")
      .eq("store_id", store.id)
      .eq("phone", clientNumber)
      .maybeSingle();

    let clientName = message.split(' ')[0]; // Primeiro nome da mensagem

    // Se cliente já existe, usar o nome dele (não alterar)
    if (existingCustomer) {
      clientName = existingCustomer.name;
    } else {
      // Cliente novo - cadastrar automaticamente com o primeiro nome
      const { data: newCustomer } = await supabase
        .from("customers")
        .insert({
          store_id: store.id,
          phone: clientNumber,
          name: clientName,
          points: 0,
        })
        .select()
        .single();
      
      if (newCustomer) {
        console.log("New customer created:", newCustomer);
      }
    }

    // Insert message into database with client name
    const { error: insertError } = await supabase
      .from("whatsapp_messages")
      .insert({
        store_id: store.id,
        client_number: clientNumber,
        sender: "client",
        message: message,
        client_name: clientName,
        read: false,
      });

    if (insertError) {
      console.error("Error inserting message:", insertError);
      throw insertError;
    }

    console.log("Message inserted successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Message received" }),
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
