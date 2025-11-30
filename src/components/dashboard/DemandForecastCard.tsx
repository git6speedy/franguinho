import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, BarChart3, Lightbulb, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PerishableStats {
  productName: string;
  prepared: number;
  sold: number;
  realDemand: number;
}

export default function DemandForecastCard() {
  const [stats, setStats] = useState<PerishableStats[]>([]);
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.store_id) {
      loadStats();
    }
  }, [profile?.store_id, period]);

  const loadStats = async () => {
    if (!profile?.store_id) return;
    setLoading(true);

    try {
      // Calculate date range based on period
      let startDate: Date;
      const endDate = new Date();

      switch (period) {
        case "week":
          startDate = subDays(endDate, 7);
          break;
        case "month":
          startDate = startOfMonth(endDate);
          break;
        case "year":
          startDate = subMonths(endDate, 12);
          break;
        default:
          startDate = subDays(endDate, 7);
      }

      // Get perishable records with items
      const { data: records, error } = await supabase
        .from("perishable_record_items")
        .select(`
          quantity,
          item_type,
          products (name),
          perishable_records!inner (
            store_id,
            record_date
          )
        `)
        .eq("perishable_records.store_id", profile.store_id)
        .gte("perishable_records.record_date", startDate.toISOString().split("T")[0])
        .lte("perishable_records.record_date", endDate.toISOString().split("T")[0]);

      if (error) throw error;

      // Get sales data from orders
      const { data: orderItems, error: ordersError } = await supabase
        .from("order_items")
        .select(`
          quantity,
          product_name,
          orders!inner (
            store_id,
            created_at,
            status
          )
        `)
        .eq("orders.store_id", profile.store_id)
        .neq("orders.status", "cancelled")
        .gte("orders.created_at", startDate.toISOString())
        .lte("orders.created_at", endDate.toISOString());

      if (ordersError) throw ordersError;

      // Aggregate stats by product
      const productStats = new Map<string, { prepared: number; sold: number; faltas: number }>();

      // Add sales data
      orderItems?.forEach((item: any) => {
        const productName = item.product_name;
        const current = productStats.get(productName) || { prepared: 0, sold: 0, faltas: 0 };
        current.sold += item.quantity;
        productStats.set(productName, current);
      });

      // Add perishable records data
      records?.forEach((record: any) => {
        const productName = record.products?.name;
        if (!productName) return;

        const current = productStats.get(productName) || { prepared: 0, sold: 0, faltas: 0 };
        
        if (record.item_type === "sobra") {
          // Sobras indicate we prepared more than sold
          current.prepared += record.quantity;
        } else if (record.item_type === "falta") {
          // Faltas indicate additional demand
          current.faltas += record.quantity;
        }
        
        productStats.set(productName, current);
      });

      // Convert to array and calculate real demand
      const statsArray: PerishableStats[] = Array.from(productStats.entries())
        .map(([productName, data]) => ({
          productName: productName.length > 15 ? productName.substring(0, 15) + "..." : productName,
          prepared: data.sold + data.prepared, // Sold + leftovers = prepared
          sold: data.sold,
          realDemand: data.sold + data.faltas, // Sold + people who wanted but couldn't buy
        }))
        .filter(s => s.prepared > 0 || s.sold > 0 || s.realDemand > 0)
        .slice(0, 5);

      setStats(statsArray);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDayOfWeek = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return format(tomorrow, "EEEE", { locale: ptBR });
  };

  // Mock insight - in future this would be AI-generated
  const mockInsight = `Previsão para amanhã (${getDayOfWeek()}): Aumentar produção em 10% baseada no histórico`;

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>Eficiência de Estoque</CardTitle>
          </div>
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <CardDescription>
          Comparativo de produção vs vendas vs demanda real
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : stats.length === 0 ? (
          <div className="h-[200px] flex flex-col items-center justify-center gap-2">
            <BarChart3 className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground text-center">
              Nenhum dado de perecíveis registrado ainda.
              <br />
              <span className="text-sm">Registre sobras e faltas ao fechar o caixa.</span>
            </p>
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="productName" 
                  tick={{ fontSize: 10 }}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="prepared" name="Preparado" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sold" name="Vendido" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="realDemand" name="Demanda Real" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}