import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Play, Pause, Eye, Download, MessageSquare, Users, 
  Clock, CheckCircle, XCircle, Loader2, Send, RefreshCw, Trash2, AlertCircle, UserCog
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Campaign {
  id: string;
  name: string;
  rule_type: string;
  rule_params: any;
  message: string;
  status: string;
  created_at: string;
  last_run_at: string | null;
  total_sent: number;
  total_failed: number;
}

interface CampaignLog {
  id: string;
  customer_name: string;
  customer_phone: string;
  message: string;
  status: string;
  error_message: string | null;
  sent_at: string;
}

interface EligibleCustomer {
  id: string;
  name: string;
  phone: string;
  selected: boolean;
}

const ruleTypes = [
  { value: "inactivity_period", label: "Período de Inatividade", description: "Clientes que não compram há X dias" },
  { value: "loyalty_reward", label: "Recompensa de Fidelidade", description: "Clientes com X+ pedidos" },
  { value: "post_purchase_thankyou", label: "Agradecimento Pós-Compra", description: "Mensagem X dias após compra" },
];

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  running: "bg-blue-500/20 text-blue-500",
  completed: "bg-green-500/20 text-green-500",
  paused: "bg-yellow-500/20 text-yellow-500",
  pending: "bg-muted text-muted-foreground",
  sent: "bg-green-500/20 text-green-500",
  failed: "bg-red-500/20 text-red-500",
  delivered: "bg-green-500/20 text-green-500",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  running: "Executando",
  completed: "Concluída",
  paused: "Pausada",
  pending: "Pendente",
  sent: "Enviado",
  failed: "Falhou",
  delivered: "Entregue",
};

const WhatsAppCampaigns = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [logs, setLogs] = useState<CampaignLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [eligibleCustomers, setEligibleCustomers] = useState<EligibleCustomer[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);
  const [isManageCustomersOpen, setIsManageCustomersOpen] = useState(false);
  const [savedCustomers, setSavedCustomers] = useState<EligibleCustomer[]>([]);
  const [savingCustomers, setSavingCustomers] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formRuleType, setFormRuleType] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formDays, setFormDays] = useState("30");
  const [formMinOrders, setFormMinOrders] = useState("10");
  const [formDaysAfter, setFormDaysAfter] = useState("1");

  useEffect(() => {
    if (profile?.store_id) {
      loadCampaigns();
    }
  }, [profile?.store_id]);

  const loadCampaigns = async () => {
    if (!profile?.store_id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("whatsapp_campaigns")
      .select("*")
      .eq("store_id", profile.store_id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao carregar campanhas", description: error.message });
    } else {
      setCampaigns(data || []);
    }
    setLoading(false);
  };

  const loadLogs = async (campaignId: string) => {
    setLogsLoading(true);
    const { data, error } = await supabase
      .from("campaign_logs")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("sent_at", { ascending: false });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao carregar logs", description: error.message });
    } else {
      setLogs(data || []);
    }
    setLogsLoading(false);
  };

  const previewEligibleCustomers = async (campaign: Campaign) => {
    if (!profile?.store_id) return;
    
    setPreviewLoading(true);
    setEligibleCustomers([]);
    
    const ruleParams = campaign.rule_params || {};
    let customers: EligibleCustomer[] = [];

    try {
      switch (campaign.rule_type) {
        case "inactivity_period": {
          const days = ruleParams.days || 30;
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);

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
                customers.push({ ...customer, selected: true });
              }
            }
          }
          break;
        }

        case "loyalty_reward": {
          const minOrders = ruleParams.min_orders || 10;
          
          const { data: allCustomers } = await supabase
            .from("customers")
            .select("id, name, phone")
            .eq("store_id", profile.store_id)
            .not("phone", "is", null);

          if (allCustomers) {
            for (const customer of allCustomers) {
              const { count } = await supabase
                .from("orders")
                .select("*", { count: "exact", head: true })
                .eq("customer_id", customer.id)
                .eq("status", "delivered");

              if ((count || 0) >= minOrders) {
                customers.push({ ...customer, selected: true });
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
            .select("customer_id, customers!inner(id, name, phone)")
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
                customers.push({
                  id: customer.id,
                  name: customer.name,
                  phone: customer.phone,
                  selected: true
                });
              }
            }
          }
          break;
        }
      }

      // Remover duplicados que já receberam
      const { data: existingLogs } = await supabase
        .from("campaign_logs")
        .select("customer_id")
        .eq("campaign_id", campaign.id)
        .in("status", ["sent", "delivered"]);

      const alreadySent = new Set(existingLogs?.map(l => l.customer_id) || []);
      customers = customers.filter(c => !alreadySent.has(c.id));

    } catch (error) {
      console.error("Erro ao buscar clientes elegíveis:", error);
    }

    setEligibleCustomers(customers);
    setPreviewLoading(false);
  };

  const handleCreateCampaign = async () => {
    if (!profile?.store_id || !formName || !formRuleType || !formMessage) {
      toast({ variant: "destructive", title: "Preencha todos os campos obrigatórios" });
      return;
    }

    const ruleParams: any = {};
    switch (formRuleType) {
      case "inactivity_period":
        ruleParams.days = parseInt(formDays);
        break;
      case "loyalty_reward":
        ruleParams.min_orders = parseInt(formMinOrders);
        break;
      case "post_purchase_thankyou":
        ruleParams.days_after = parseInt(formDaysAfter);
        break;
    }

    const { error } = await supabase
      .from("whatsapp_campaigns")
      .insert({
        store_id: profile.store_id,
        name: formName,
        rule_type: formRuleType,
        rule_params: ruleParams,
        message: formMessage,
        status: "draft"
      });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao criar campanha", description: error.message });
    } else {
      toast({ title: "Campanha criada com sucesso!" });
      setIsDialogOpen(false);
      resetForm();
      loadCampaigns();
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta campanha?")) return;

    const { error } = await supabase
      .from("whatsapp_campaigns")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir campanha", description: error.message });
    } else {
      toast({ title: "Campanha excluída!" });
      loadCampaigns();
    }
  };

  const handleExecuteCampaign = async () => {
    if (!selectedCampaign) return;

    const selectedIds = eligibleCustomers.filter(c => c.selected).map(c => c.id);
    if (selectedIds.length === 0) {
      toast({ variant: "destructive", title: "Selecione pelo menos um cliente" });
      return;
    }

    setExecuting(selectedCampaign.id);
    setIsPreviewOpen(false);

    try {
      const { data, error } = await supabase.functions.invoke("execute-campaign", {
        body: {
          campaignId: selectedCampaign.id,
          selectedCustomerIds: selectedIds
        }
      });

      if (error) throw error;

      // Enviar notificação
      const event = new CustomEvent('whatsapp-notification', {
        detail: {
          title: `Campanha "${selectedCampaign.name}" concluída`,
          message: `${data.totalSent} mensagens enviadas, ${data.totalFailed} falhas`,
          time: new Date().toISOString(),
        }
      });
      window.dispatchEvent(event);

      toast({
        title: "Campanha executada!",
        description: `${data.totalSent} mensagens enviadas, ${data.totalFailed} falhas`
      });

      loadCampaigns();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao executar campanha",
        description: error.message
      });
    } finally {
      setExecuting(null);
    }
  };

  const exportLogsCSV = () => {
    if (logs.length === 0) return;

    const headers = ["Cliente", "Telefone", "Mensagem", "Status", "Erro", "Data/Hora"];
    const rows = logs.map(log => [
      log.customer_name || "",
      log.customer_phone,
      `"${log.message.replace(/"/g, '""')}"`,
      statusLabels[log.status] || log.status,
      log.error_message || "",
      format(new Date(log.sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `campanha_logs_${selectedCampaign?.name || "export"}.csv`;
    link.click();
  };

  const resetForm = () => {
    setFormName("");
    setFormRuleType("");
    setFormMessage("");
    setFormDays("30");
    setFormMinOrders("10");
    setFormDaysAfter("1");
  };

  const toggleCustomerSelection = (customerId: string) => {
    setEligibleCustomers(prev => 
      prev.map(c => c.id === customerId ? { ...c, selected: !c.selected } : c)
    );
  };

  const toggleAllCustomers = (selected: boolean) => {
    setEligibleCustomers(prev => prev.map(c => ({ ...c, selected })));
  };

  const loadSavedCustomers = async (campaign: Campaign) => {
    if (!profile?.store_id) return;
    
    setPreviewLoading(true);
    setSavedCustomers([]);
    
    // First load all customers from the store
    const { data: allCustomers } = await supabase
      .from("customers")
      .select("id, name, phone")
      .eq("store_id", profile.store_id)
      .not("phone", "is", null);

    if (!allCustomers) {
      setPreviewLoading(false);
      return;
    }

    // Then load saved selections for this campaign
    const { data: savedSelections } = await supabase
      .from("campaign_customers")
      .select("customer_id, is_selected")
      .eq("campaign_id", campaign.id);

    const selectionsMap = new Map(savedSelections?.map(s => [s.customer_id, s.is_selected]) || []);
    
    const customersWithSelection = allCustomers.map(c => ({
      ...c,
      selected: selectionsMap.has(c.id) ? selectionsMap.get(c.id)! : false
    }));

    setSavedCustomers(customersWithSelection);
    setPreviewLoading(false);
  };

  const handleSaveCustomerSelections = async () => {
    if (!selectedCampaign) return;
    
    setSavingCustomers(true);
    
    try {
      // Delete existing selections
      await supabase
        .from("campaign_customers")
        .delete()
        .eq("campaign_id", selectedCampaign.id);

      // Insert new selections (only selected ones)
      const selectedIds = savedCustomers.filter(c => c.selected);
      if (selectedIds.length > 0) {
        const { error } = await supabase
          .from("campaign_customers")
          .insert(
            selectedIds.map(c => ({
              campaign_id: selectedCampaign.id,
              customer_id: c.id,
              is_selected: true
            }))
          );

        if (error) throw error;
      }

      toast({ title: `${selectedIds.length} clientes salvos na campanha` });
      setIsManageCustomersOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setSavingCustomers(false);
    }
  };

  const toggleSavedCustomerSelection = (customerId: string) => {
    setSavedCustomers(prev => 
      prev.map(c => c.id === customerId ? { ...c, selected: !c.selected } : c)
    );
  };

  const toggleAllSavedCustomers = (selected: boolean) => {
    setSavedCustomers(prev => prev.map(c => ({ ...c, selected })));
  };

  const handleAutoSelectCustomers = async () => {
    if (!selectedCampaign || !profile?.store_id) return;
    
    setPreviewLoading(true);
    
    const ruleParams = selectedCampaign.rule_params || {};
    const eligibleIds = new Set<string>();

    try {
      switch (selectedCampaign.rule_type) {
        case "inactivity_period": {
          const days = ruleParams.days || 30;
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);

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
                eligibleIds.add(customer.id);
              }
            }
          }
          break;
        }

        case "loyalty_reward": {
          const minOrders = ruleParams.min_orders || 10;
          
          const { data: allCustomers } = await supabase
            .from("customers")
            .select("id, name, phone")
            .eq("store_id", profile.store_id)
            .not("phone", "is", null);

          if (allCustomers) {
            for (const customer of allCustomers) {
              const { count } = await supabase
                .from("orders")
                .select("*", { count: "exact", head: true })
                .eq("customer_id", customer.id)
                .eq("status", "delivered");

              if ((count || 0) >= minOrders) {
                eligibleIds.add(customer.id);
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
            .select("customer_id, customers!inner(id, name, phone)")
            .eq("store_id", profile.store_id)
            .eq("status", "delivered")
            .gte("created_at", startOfDay.toISOString())
            .lte("created_at", endOfDay.toISOString());

          if (recentOrders) {
            for (const order of recentOrders) {
              const customer = order.customers as any;
              if (customer?.phone) {
                eligibleIds.add(customer.id);
              }
            }
          }
          break;
        }
      }

      // Update saved customers selection based on eligible IDs
      setSavedCustomers(prev => prev.map(c => ({
        ...c,
        selected: eligibleIds.has(c.id)
      })));

      toast({
        title: "Auto-seleção concluída",
        description: `${eligibleIds.size} clientes foram selecionados de acordo com a motivação da campanha.`
      });
    } catch (error) {
      console.error("Erro ao auto-selecionar clientes:", error);
      toast({
        variant: "destructive",
        title: "Erro ao auto-selecionar",
        description: "Ocorreu um erro ao processar a seleção automática."
      });
    }
    
    setPreviewLoading(false);
  };

  const getRuleLabel = (ruleType: string) => {
    return ruleTypes.find(r => r.value === ruleType)?.label || ruleType;
  };

  const getRuleDescription = (campaign: Campaign) => {
    const params = campaign.rule_params || {};
    switch (campaign.rule_type) {
      case "inactivity_period":
        return `Clientes sem compras há ${params.days || 30} dias`;
      case "loyalty_reward":
        return `Clientes com ${params.min_orders || 10}+ pedidos`;
      case "post_purchase_thankyou":
        return `${params.days_after || 1} dia(s) após compra`;
      default:
        return "";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            Campanhas de WhatsApp
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie campanhas de mensagens para seus clientes
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Nova Campanha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Campanha *</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Reativação de Clientes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rule">Regra *</Label>
                <Select value={formRuleType} onValueChange={setFormRuleType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma regra" />
                  </SelectTrigger>
                  <SelectContent>
                    {ruleTypes.map(rule => (
                      <SelectItem key={rule.value} value={rule.value}>
                        <div>
                          <div className="font-medium">{rule.label}</div>
                          <div className="text-xs text-muted-foreground">{rule.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formRuleType === "inactivity_period" && (
                <div className="space-y-2">
                  <Label htmlFor="days">Dias de Inatividade</Label>
                  <Input
                    id="days"
                    type="number"
                    value={formDays}
                    onChange={(e) => setFormDays(e.target.value)}
                    min="1"
                  />
                </div>
              )}

              {formRuleType === "loyalty_reward" && (
                <div className="space-y-2">
                  <Label htmlFor="minOrders">Mínimo de Pedidos</Label>
                  <Input
                    id="minOrders"
                    type="number"
                    value={formMinOrders}
                    onChange={(e) => setFormMinOrders(e.target.value)}
                    min="1"
                  />
                </div>
              )}

              {formRuleType === "post_purchase_thankyou" && (
                <div className="space-y-2">
                  <Label htmlFor="daysAfter">Dias Após Compra</Label>
                  <Input
                    id="daysAfter"
                    type="number"
                    value={formDaysAfter}
                    onChange={(e) => setFormDaysAfter(e.target.value)}
                    min="1"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem *</Label>
                <Textarea
                  id="message"
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="Use {nome} para personalizar com o nome do cliente"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Dica: Use {"{nome}"} para incluir o nome do cliente na mensagem
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleCreateCampaign}>
                  Criar Campanha
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Campanhas */}
      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhuma campanha criada</h3>
              <p className="text-muted-foreground">Crie sua primeira campanha para começar</p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map(campaign => (
            <Card key={campaign.id} className="transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <Badge className={statusColors[campaign.status]}>
                        {statusLabels[campaign.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getRuleLabel(campaign.rule_type)} • {getRuleDescription(campaign)}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {campaign.total_sent} enviados
                      </span>
                      {campaign.total_failed > 0 && (
                        <span className="flex items-center gap-1">
                          <XCircle className="h-4 w-4 text-red-500" />
                          {campaign.total_failed} falhas
                        </span>
                      )}
                      {campaign.last_run_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Última execução: {format(new Date(campaign.last_run_at), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        loadSavedCustomers(campaign);
                        setIsManageCustomersOpen(true);
                      }}
                    >
                      <UserCog className="h-4 w-4 mr-1" />
                      Clientes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        loadLogs(campaign.id);
                        setIsLogsOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Logs
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        previewEligibleCustomers(campaign);
                        setIsPreviewOpen(true);
                      }}
                      disabled={executing === campaign.id || campaign.status === "running"}
                    >
                      {executing === campaign.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-1" />
                      )}
                      Start
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCampaign(campaign.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm italic">{campaign.message}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Logs */}
      <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Logs de Envio - {selectedCampaign?.name}</span>
              <Button variant="outline" size="sm" onClick={exportLogsCSV} disabled={logs.length === 0}>
                <Download className="h-4 w-4 mr-1" />
                Exportar CSV
              </Button>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum log de envio encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id} className="animate-in fade-in duration-300">
                      <TableCell className="font-medium">{log.customer_name || "-"}</TableCell>
                      <TableCell>{log.customer_phone}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[log.status]}>
                          {statusLabels[log.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(log.sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-red-500 text-sm max-w-[200px] truncate">
                        {log.error_message || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog de Preview/Execução */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Executar Campanha - {selectedCampaign?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione os clientes que receberão a mensagem. Clientes que já receberam esta campanha foram removidos.
            </p>

            {previewLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : eligibleCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum cliente elegível encontrado</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Todos os clientes elegíveis já receberam esta campanha ou não há clientes que correspondem à regra.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {eligibleCustomers.filter(c => c.selected).length} de {eligibleCustomers.length} selecionados
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleAllCustomers(true)}>
                      Selecionar Todos
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleAllCustomers(false)}>
                      Desmarcar Todos
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[300px] border rounded-lg">
                  <div className="p-2 space-y-1">
                    {eligibleCustomers.map(customer => (
                      <div
                        key={customer.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => toggleCustomerSelection(customer.id)}
                      >
                        <Checkbox
                          checked={customer.selected}
                          onCheckedChange={() => toggleCustomerSelection(customer.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsPreviewOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleExecuteCampaign}
                    disabled={eligibleCustomers.filter(c => c.selected).length === 0}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar para {eligibleCustomers.filter(c => c.selected).length} clientes
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gerenciar Clientes */}
      <Dialog open={isManageCustomersOpen} onOpenChange={setIsManageCustomersOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Gerenciar Clientes - {selectedCampaign?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione os clientes que devem fazer parte desta campanha. Esta seleção será salva e usada ao executar a campanha.
            </p>

            {previewLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : savedCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum cliente encontrado</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {savedCustomers.filter(c => c.selected).length} de {savedCustomers.length} selecionados
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={handleAutoSelectCustomers}
                      disabled={previewLoading}
                    >
                      {previewLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        "Auto Selecionar"
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleAllSavedCustomers(true)}>
                      Selecionar Todos
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toggleAllSavedCustomers(false)}>
                      Desmarcar Todos
                    </Button>
                  </div>
                </div>

                <ScrollArea className="h-[300px] border rounded-lg">
                  <div className="p-2 space-y-1">
                    {savedCustomers.map(customer => (
                      <div
                        key={customer.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => toggleSavedCustomerSelection(customer.id)}
                      >
                        <Checkbox
                          checked={customer.selected}
                          onCheckedChange={() => toggleSavedCustomerSelection(customer.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsManageCustomersOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSaveCustomerSelections}
                    disabled={savingCustomers}
                  >
                    {savingCustomers ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Salvar {savedCustomers.filter(c => c.selected).length} clientes
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppCampaigns;
