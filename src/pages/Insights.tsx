import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Copy, Eye, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase as sb } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const supabase: any = sb;

interface Insight {
  id: string;
  comparison_date: string;
  comparison_period: string;
  response_text: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export default function Insights() {
  const [comparisonType, setComparisonType] = useState<"day" | "week" | "month">("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [compareWithDate, setCompareWithDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [showInsightDialog, setShowInsightDialog] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(10);
  const [todayInsightsCount, setTodayInsightsCount] = useState(0);

  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.store_id) {
      loadInsights();
      loadDailyLimit();
      loadTodayCount();

      // Realtime subscription para atualizar lista e mostrar popup quando completado
      const insightsChannel = supabase
        .channel('insights-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ai_insights',
            filter: `store_id=eq.${profile.store_id}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              // Quando inserir, apenas recarregar a lista (não a contagem)
              loadInsights();
            } else if (payload.eventType === 'UPDATE') {
              loadInsights();
              
              // Só recarregar contagem se o status mudou para 'completed'
              if (payload.new.status === 'completed' && payload.old.status !== 'completed') {
                loadTodayCount();
                
                // Mostrar popup automaticamente
                setSelectedInsight(payload.new as Insight);
                setShowInsightDialog(true);
              }
            } else if (payload.eventType === 'DELETE') {
              // Quando deletar, apenas recarregar a lista (NÃO recarregar contagem)
              loadInsights();
            }
          }
        )
        .subscribe();

      // Realtime subscription para mudanças nas configurações de IA
      const aiSettingsChannel = supabase
        .channel('ai-settings-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ai_settings'
          },
          () => {
            // Recarregar limite quando admin alterar configurações
            loadDailyLimit();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(insightsChannel);
        supabase.removeChannel(aiSettingsChannel);
      };
    }
  }, [profile]);

  const loadDailyLimit = async () => {
    const { data, error } = await supabase
      .from("ai_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar limite diário:", error);
      setDailyLimit(10);
      return;
    }

    if (data && data.daily_limit_per_store) {
      setDailyLimit(data.daily_limit_per_store);
    } else {
      setDailyLimit(10);
    }
  };

  const loadTodayCount = async () => {
    if (!profile?.store_id) return;

    const today = new Date().toISOString().split("T")[0];
    
    // Contar apenas insights com status 'completed'
    const { count } = await supabase
      .from("ai_insights")
      .select("*", { count: "exact", head: true })
      .eq("store_id", profile.store_id)
      .gte("request_date", `${today}T00:00:00`)
      .lte("request_date", `${today}T23:59:59`)
      .eq("status", "completed");

    setTodayInsightsCount(count || 0);
  };

  const loadInsights = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("ai_insights")
      .select("*")
      .eq("store_id", profile.store_id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar insights",
        description: error.message,
      });
    } else {
      setInsights(data || []);
    }
  };

  const handleRequestInsight = async () => {
    if (!profile?.store_id) return;

    // Verificar limite diário
    if (todayInsightsCount >= dailyLimit) {
      toast({
        variant: "destructive",
        title: "Limite atingido",
        description: `Você atingiu o limite diário de ${dailyLimit} insights. Tente novamente amanhã.`,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Buscar dados da loja
      const { data: storeData } = await supabase
        .from("stores")
        .select("name, display_name, description, address")
        .eq("id", profile.store_id)
        .single();

      // Determinar período de comparação
      let startDate: Date;
      let endDate: Date;
      let comparisonStartDate: Date | null = null;
      let comparisonEndDate: Date | null = null;

      if (comparisonType === "day") {
        startDate = selectedDate;
        endDate = selectedDate;
        // Para comparação de dias, usar o segundo dia selecionado
        comparisonStartDate = compareWithDate;
        comparisonEndDate = compareWithDate;
      } else if (comparisonType === "week") {
        startDate = startOfWeek(selectedDate, { locale: ptBR });
        endDate = endOfWeek(selectedDate, { locale: ptBR });
      } else {
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
      }

      // Buscar caixas abertos no período para determinar dias_opened
      const { data: cashRegistersData } = await supabase
        .from("cash_register")
        .select("opened_at, closed_at")
        .eq("store_id", profile.store_id)
        .gte("opened_at", startDate.toISOString())
        .lte("opened_at", endDate.toISOString());

      const daysOpened = (Array.from(
        new Set(
          (cashRegistersData || []).map(cr => 
            format(parseISO(cr.opened_at as string), "yyyy-MM-dd")
          )
        )
      ) as string[]).sort();

      // Buscar dados de vendas e estoque do período
      const { data: ordersData } = await supabase
        .from("orders")
        .select(`
          id,
          total,
          created_at,
          order_items (
            product_id,
            product_name,
            quantity,
            variation_name
          )
        `)
        .eq("store_id", profile.store_id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .neq("status", "cancelled");

      // Agrupar vendas por dia
      const salesByDay = new Map<string, Array<{ name: string; quantity_sold: number }>>();
      
      (ordersData || []).forEach(order => {
        const dateKey = format(parseISO(order.created_at as string), "yyyy-MM-dd");
        
        if (!salesByDay.has(dateKey)) {
          salesByDay.set(dateKey, []);
        }
        
        const dayProducts = salesByDay.get(dateKey)!;
        
        (order.order_items || []).forEach((item: any) => {
          const productName = item.variation_name 
            ? `${item.product_name} - ${item.variation_name}`
            : item.product_name;
          
          const existing = dayProducts.find(p => p.name === productName);
          if (existing) {
            existing.quantity_sold += item.quantity;
          } else {
            dayProducts.push({ name: productName, quantity_sold: item.quantity });
          }
        });
      });

      const dailySalesBreakdown = daysOpened.map(date => ({
        date,
        products_sold: salesByDay.get(date) || []
      }));

      // Se for comparação de dias, buscar dados do dia de comparação também
      let comparisonDailySalesBreakdown = null;
      let comparisonDaysOpened = null;
      let comparisonOrdersData = null;

      if (comparisonType === "day" && comparisonStartDate && comparisonEndDate) {
        const { data: comparisonCashRegistersData } = await supabase
          .from("cash_register")
          .select("opened_at, closed_at")
          .eq("store_id", profile.store_id)
          .gte("opened_at", comparisonStartDate.toISOString())
          .lte("opened_at", comparisonEndDate.toISOString());

        comparisonDaysOpened = (Array.from(
          new Set(
            (comparisonCashRegistersData || []).map(cr => 
              format(parseISO(cr.opened_at as string), "yyyy-MM-dd")
            )
          )
        ) as string[]).sort();

        const { data: comparisonOrdersDataRaw } = await supabase
          .from("orders")
          .select(`
            id,
            total,
            created_at,
            order_items (
              product_id,
              product_name,
              quantity,
              variation_name
            )
          `)
          .eq("store_id", profile.store_id)
          .gte("created_at", comparisonStartDate.toISOString())
          .lte("created_at", comparisonEndDate.toISOString())
          .neq("status", "cancelled");

        comparisonOrdersData = comparisonOrdersDataRaw;

        const comparisonSalesByDay = new Map<string, Array<{ name: string; quantity_sold: number }>>();
        
        (comparisonOrdersDataRaw || []).forEach(order => {
          const dateKey = format(parseISO(order.created_at as string), "yyyy-MM-dd");
          
          if (!comparisonSalesByDay.has(dateKey)) {
            comparisonSalesByDay.set(dateKey, []);
          }
          
          const dayProducts = comparisonSalesByDay.get(dateKey)!;
          
          (order.order_items || []).forEach((item: any) => {
            const productName = item.variation_name 
              ? `${item.product_name} - ${item.variation_name}`
              : item.product_name;
            
            const existing = dayProducts.find(p => p.name === productName);
            if (existing) {
              existing.quantity_sold += item.quantity;
            } else {
              dayProducts.push({ name: productName, quantity_sold: item.quantity });
            }
          });
        });

        comparisonDailySalesBreakdown = comparisonDaysOpened.map(date => ({
          date,
          products_sold: comparisonSalesByDay.get(date) || []
        }));
      }

      // Buscar produtos perecíveis
      const { data: perishableProducts } = await supabase
        .from("products")
        .select("id, name, stock_quantity")
        .eq("store_id", profile.store_id)
        .eq("is_perishable", true)
        .eq("active", true);

      // Criar payload para webhook
      const payload: any = {
        store_name: storeData?.display_name || storeData?.name,
        store_description: storeData?.description || "Não informado",
        store_address: storeData?.address || "Não informado",
        comparison_date: format(selectedDate, "dd/MM/yyyy", { locale: ptBR }),
        comparison_period: comparisonType,
        period_start: format(startDate, "dd/MM/yyyy", { locale: ptBR }),
        period_end: format(endDate, "dd/MM/yyyy", { locale: ptBR }),
        days_opened: daysOpened,
        daily_sales_breakdown: dailySalesBreakdown,
        total_items_sold: ordersData?.reduce((sum, order) => 
          sum + (order.order_items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0), 0
        ) || 0,
        orders_count: ordersData?.length || 0,
        perishable_products: perishableProducts?.map(p => ({
          name: p.name,
          current_stock: p.stock_quantity
        })) || [],
      };

      // Se for comparação de dias, adicionar dados do dia de comparação
      if (comparisonType === "day" && comparisonDailySalesBreakdown && comparisonDaysOpened && comparisonOrdersData) {
        payload.comparison_with_date = format(compareWithDate, "dd/MM/yyyy", { locale: ptBR });
        payload.comparison_days_opened = comparisonDaysOpened;
        payload.comparison_daily_sales_breakdown = comparisonDailySalesBreakdown;
        payload.comparison_total_items_sold = comparisonOrdersData?.reduce((sum, order) => 
          sum + (order.order_items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0), 0
        ) || 0;
        payload.comparison_orders_count = comparisonOrdersData?.length || 0;
      }

      // Salvar insight pendente
      const { data: newInsight, error: insertError } = await supabase
        .from("ai_insights")
        .insert({
          store_id: profile.store_id,
          comparison_date: format(selectedDate, "yyyy-MM-dd"),
          comparison_period: comparisonType,
          request_payload: payload,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Atualizar contagem antes de chamar a função
      await loadTodayCount();

      // Chamar edge function para enviar ao webhook
      const { data: functionData, error: functionError } = await supabase.functions.invoke('request-ai-insight', {
        body: { insightId: newInsight.id, payload }
      });

      if (functionError) throw functionError;

      toast({
        title: "Insight solicitado!",
        description: "A IA está processando sua solicitação. O insight será atualizado automaticamente.",
      });

      // Aguardar um pouco para garantir que o realtime pegue a atualização
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Recarregar insights para pegar o status atualizado
      await loadInsights();
    } catch (error: any) {
      console.error("Erro ao solicitar insight:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar insight",
        description: error.message || "Ocorreu um erro ao processar sua solicitação.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInsight = (insight: Insight) => {
    setSelectedInsight(insight);
    setShowInsightDialog(true);
  };

  const handleCopyInsight = () => {
    if (selectedInsight?.response_text) {
      navigator.clipboard.writeText(selectedInsight.response_text);
      toast({
        title: "Texto copiado!",
        description: "O insight foi copiado para a área de transferência.",
      });
    }
  };

  const handleDeleteInsight = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este insight?")) return;

    const { error } = await supabase
      .from("ai_insights")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir insight",
        description: error.message,
      });
    } else {
      toast({
        title: "Insight excluído!",
        description: "O insight foi removido, mas o crédito já foi consumido e não será devolvido.",
      });
      // NÃO chamar loadInsights() aqui - o realtime já vai atualizar
      // NÃO chamar loadTodayCount() - a exclusão não deve afetar a contagem do dia
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Insights de IA</h1>
          <p className="text-muted-foreground">
            Obtenha sugestões automáticas baseadas em seus dados de vendas
          </p>
        </div>
      </div>

      {/* Card de Solicitação */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Novo Insight</CardTitle>
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  {todayInsightsCount}/{dailyLimit}
                </span>
              </div>
              <CardDescription>
                Selecione um período para comparação e gere sugestões personalizadas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={cn(
            "grid gap-4",
            comparisonType === "day" ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
          )}>
            <div className="space-y-2">
              <Label>Tipo de Comparação</Label>
              <Select value={comparisonType} onValueChange={(value: any) => setComparisonType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dia</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{comparisonType === "day" ? "Dia a ser comparado" : "Data de Referência"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={ptBR}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {comparisonType === "day" && (
              <div className="space-y-2">
                <Label>Com que dia</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(compareWithDate, "dd/MM/yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={compareWithDate}
                      onSelect={(date) => date && setCompareWithDate(date)}
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <Button
            onClick={handleRequestInsight} 
            disabled={isLoading || todayInsightsCount >= dailyLimit}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando insight...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Solicitar Insight
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Histórico de Insights */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Histórico de Insights</CardTitle>
          <CardDescription>Últimos insights gerados pela IA</CardDescription>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum insight gerado ainda. Solicite um novo insight acima.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {insights.map((insight) => (
                  <TableRow key={insight.id}>
                    <TableCell>
                      {format(parseISO(insight.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {insight.comparison_period === "day" && "Dia"}
                      {insight.comparison_period === "week" && "Semana"}
                      {insight.comparison_period === "month" && "Mês"}
                      {" - "}
                      {format(parseISO(insight.comparison_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {insight.status === "pending" && (
                        <span className="text-yellow-600 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Processando
                        </span>
                      )}
                      {insight.status === "completed" && (
                        <span className="text-green-600">Concluído</span>
                      )}
                      {insight.status === "failed" && (
                        <span className="text-red-600">Falhou</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {insight.status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewInsight(insight)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteInsight(insight.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Visualização */}
      <Dialog open={showInsightDialog} onOpenChange={setShowInsightDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Insight Gerado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[60vh]">
            <Textarea
              value={selectedInsight?.response_text || "Processando..."}
              readOnly
              className="min-h-[400px] font-mono text-sm"
            />
            {selectedInsight?.error_message && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
                <p className="text-sm">{selectedInsight.error_message}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowInsightDialog(false)}>
              Fechar
            </Button>
            <Button onClick={handleCopyInsight} disabled={!selectedInsight?.response_text}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Texto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
