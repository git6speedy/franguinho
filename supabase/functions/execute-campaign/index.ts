import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CampaignParams {
  campaignId: string;
  selectedCustomerIds?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Autenticação
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

    const { campaignId, selectedCustomerIds }: CampaignParams = await req.json();

    console.log("Executando campanha:", campaignId);

    // Buscar campanha
    const { data: campaign, error: campaignError } = await supabase
      .from("whatsapp_campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("store_id", profile.store_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campanha não encontrada");
    }

    // Buscar configurações de WhatsApp da loja
    const { data: store } = await supabase
      .from("stores")
      .select("whatsapp_enabled, whatsapp_n8n_endpoint, whatsapp_n8n_token")
      .eq("id", profile.store_id)
      .single();

    if (!store?.whatsapp_enabled || !store?.whatsapp_n8n_endpoint) {
      throw new Error("WhatsApp não configurado para esta loja");
    }

    // Atualizar status da campanha para running
    await supabase
      .from("whatsapp_campaigns")
      .update({ status: "running", last_run_at: new Date().toISOString() })
      .eq("id", campaignId);

    // Buscar clientes elegíveis baseado na regra
    let eligibleCustomers: any[] = [];
    const ruleParams = campaign.rule_params || {};

    switch (campaign.rule_type) {
      case "inactivity_period": {
        const days = ruleParams.days || 30;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        // Buscar clientes que não fizeram pedidos nos últimos X dias
        const { data: allCustomers } = await supabase
          .from("customers")
          .select("id, name, phone")
          .eq("store_id", profile.store_id)
          .not("phone", "is", null);

        if (allCustomers) {
          for (const customer of allCustomers) {
            const { data: lastOrder } = await supabase
              .from("orders")
              .select("created_at")
              .eq("customer_id", customer.id)
              .eq("status", "delivered")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (!lastOrder || new Date(lastOrder.created_at) < cutoffDate) {
              eligibleCustomers.push(customer);
            }
          }
        }
        break;
      }

      case "loyalty_reward": {
        const minOrders = ruleParams.min_orders || 10;

        const { data: customersWithOrders } = await supabase
          .from("customers")
          .select(`
            id, name, phone,
            orders!inner(id)
          `)
          .eq("store_id", profile.store_id)
          .not("phone", "is", null);

        if (customersWithOrders) {
          // Agrupar e contar pedidos por cliente
          const customerOrderCounts = new Map();
          for (const customer of customersWithOrders) {
            const count = customerOrderCounts.get(customer.id) || 0;
            customerOrderCounts.set(customer.id, count + 1);
          }

          const { data: allCustomers } = await supabase
            .from("customers")
            .select("id, name, phone")
            .eq("store_id", profile.store_id)
            .not("phone", "is", null);

          if (allCustomers) {
            for (const customer of allCustomers) {
              const orderCount = customerOrderCounts.get(customer.id) || 0;
              if (orderCount >= minOrders) {
                eligibleCustomers.push(customer);
              }
            }
          }
        }
        break;
      }

      case "post_purchase_thankyou": {
        const daysAfter = ruleParams.days_after || 1;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - daysAfter);
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: recentOrders } = await supabase
          .from("orders")
          .select(`
            customer_id,
            customers!inner(id, name, phone)
          `)
          .eq("store_id", profile.store_id)
          .eq("status", "delivered")
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString());

        if (recentOrders) {
          const seenIds = new Set();
          for (const order of recentOrders) {
            const customer = order.customers as any;
            if (customer?.phone && !seenIds.has(customer.id)) {
              seenIds.add(customer.id);
              eligibleCustomers.push({
                id: customer.id,
                name: customer.name,
                phone: customer.phone
              });
            }
          }
        }
        break;
      }
    }

    // Filtrar por clientes selecionados se especificado
    if (selectedCustomerIds && selectedCustomerIds.length > 0) {
      eligibleCustomers = eligibleCustomers.filter(c => 
        selectedCustomerIds.includes(c.id)
      );
    }

    // Verificar duplicados - não enviar para quem já recebeu esta campanha
    const { data: existingLogs } = await supabase
      .from("campaign_logs")
      .select("customer_id")
      .eq("campaign_id", campaignId)
      .in("status", ["sent", "delivered"]);

    const alreadySent = new Set(existingLogs?.map(l => l.customer_id) || []);
    eligibleCustomers = eligibleCustomers.filter(c => !alreadySent.has(c.id));

    console.log(`Clientes elegíveis para envio: ${eligibleCustomers.length}`);

    let totalSent = 0;
    let totalFailed = 0;

    // Enviar mensagens
    for (const customer of eligibleCustomers) {
      try {
        // Personalizar mensagem com nome do cliente
        const personalizedMessage = campaign.message.replace(/\{nome\}/gi, customer.name || "Cliente");

        // Criar log do envio
        const { data: log } = await supabase
          .from("campaign_logs")
          .insert({
            campaign_id: campaignId,
            customer_id: customer.id,
            customer_name: customer.name,
            customer_phone: customer.phone,
            message: personalizedMessage,
            status: "pending"
          })
          .select()
          .single();

        // Enviar via n8n
        const webhookResponse = await fetch(store.whatsapp_n8n_endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(store.whatsapp_n8n_token && {
              "Authorization": `Bearer ${store.whatsapp_n8n_token}`
            }),
          },
          body: JSON.stringify({
            clientNumber: customer.phone,
            message: personalizedMessage,
            storeId: profile.store_id,
            campaignId: campaignId,
          }),
        });

        if (webhookResponse.ok) {
          await supabase
            .from("campaign_logs")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", log?.id);
          totalSent++;
        } else {
          const errorText = await webhookResponse.text();
          await supabase
            .from("campaign_logs")
            .update({ status: "failed", error_message: errorText })
            .eq("id", log?.id);
          totalFailed++;
        }

        // Pequeno delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Erro ao enviar para ${customer.phone}:`, error);
        totalFailed++;
      }
    }

    // Atualizar campanha com totais
    await supabase
      .from("whatsapp_campaigns")
      .update({
        status: "completed",
        total_sent: campaign.total_sent + totalSent,
        total_failed: campaign.total_failed + totalFailed
      })
      .eq("id", campaignId);

    console.log(`Campanha concluída: ${totalSent} enviados, ${totalFailed} falhas`);

    return new Response(
      JSON.stringify({
        success: true,
        totalSent,
        totalFailed,
        totalEligible: eligibleCustomers.length
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
