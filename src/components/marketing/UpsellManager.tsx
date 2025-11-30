import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, TrendingUp } from "lucide-react";
import { supabase as sb } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const supabase: any = sb;

interface Product {
  id: string;
  name: string;
  price: number;
}

interface UpsellRule {
  id: string;
  product_id: string;
  product?: Product;
  trigger_type: "always" | "cart_total";
  min_cart_total?: number;
  use_discount: boolean;
  discount_price?: number;
  is_active: boolean;
}

export default function UpsellManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [upsellRules, setUpsellRules] = useState<UpsellRule[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<UpsellRule | null>(null);
  
  const [selectedProductId, setSelectedProductId] = useState("");
  const [triggerType, setTriggerType] = useState<"always" | "cart_total">("always");
  const [minCartTotal, setMinCartTotal] = useState("");
  const [useDiscount, setUseDiscount] = useState(false);
  const [discountPrice, setDiscountPrice] = useState("");

  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.store_id) {
      loadProducts();
      loadUpsellRules();
    }
  }, [profile]);

  const loadProducts = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("products")
      .select("id, name, price")
      .eq("store_id", profile.store_id)
      .eq("active", true)
      .order("name");

    if (error) {
      console.error("Erro ao carregar produtos:", error);
    } else {
      setProducts(data || []);
    }
  };

  const loadUpsellRules = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("upsell_rules")
      .select(`
        *,
        product:products(id, name, price)
      `)
      .eq("store_id", profile.store_id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar regras de upsell",
        description: error.message,
      });
    } else {
      setUpsellRules(data || []);
    }
  };

  const openNewRuleDialog = () => {
    setEditingRule(null);
    setSelectedProductId("");
    setTriggerType("always");
    setMinCartTotal("");
    setUseDiscount(false);
    setDiscountPrice("");
    setShowDialog(true);
  };

  const openEditRuleDialog = (rule: UpsellRule) => {
    setEditingRule(rule);
    setSelectedProductId(rule.product_id);
    setTriggerType(rule.trigger_type);
    setMinCartTotal(rule.min_cart_total?.toString() || "");
    setUseDiscount(rule.use_discount);
    setDiscountPrice(rule.discount_price?.toString() || "");
    setShowDialog(true);
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId) {
      toast({
        variant: "destructive",
        title: "Selecione um produto",
      });
      return;
    }

    if (triggerType === "cart_total" && (!minCartTotal || parseFloat(minCartTotal) <= 0)) {
      toast({
        variant: "destructive",
        title: "Valor mínimo inválido",
        description: "Defina um valor mínimo válido para o carrinho.",
      });
      return;
    }

    if (useDiscount && (!discountPrice || parseFloat(discountPrice) <= 0)) {
      toast({
        variant: "destructive",
        title: "Preço com desconto inválido",
        description: "Defina um preço com desconto válido.",
      });
      return;
    }

    const ruleData = {
      store_id: profile.store_id,
      product_id: selectedProductId,
      trigger_type: triggerType,
      min_cart_total: triggerType === "cart_total" ? parseFloat(minCartTotal) : null,
      use_discount: useDiscount,
      discount_price: useDiscount ? parseFloat(discountPrice) : null,
    };

    if (editingRule) {
      const { error } = await supabase
        .from("upsell_rules")
        .update(ruleData)
        .eq("id", editingRule.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao atualizar regra",
          description: error.message,
        });
      } else {
        toast({
          title: "Regra atualizada!",
        });
        setShowDialog(false);
        loadUpsellRules();
      }
    } else {
      const { error } = await supabase
        .from("upsell_rules")
        .insert(ruleData);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao criar regra",
          description: error.message,
        });
      } else {
        toast({
          title: "Regra criada!",
        });
        setShowDialog(false);
        loadUpsellRules();
      }
    }
  };

  const handleToggleActive = async (rule: UpsellRule) => {
    const { error } = await supabase
      .from("upsell_rules")
      .update({ is_active: !rule.is_active })
      .eq("id", rule.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar regra",
        description: error.message,
      });
    } else {
      loadUpsellRules();
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Deseja realmente excluir esta regra de upsell?")) return;

    const { error } = await supabase
      .from("upsell_rules")
      .delete()
      .eq("id", ruleId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir regra",
        description: error.message,
      });
    } else {
      toast({
        title: "Regra excluída!",
      });
      loadUpsellRules();
    }
  };

  const getTriggerLabel = (rule: UpsellRule) => {
    if (rule.trigger_type === "always") {
      return "Sempre exibir";
    }
    return `Carrinho > R$ ${rule.min_cart_total?.toFixed(2)}`;
  };

  const getPriceLabel = (rule: UpsellRule) => {
    if (!rule.product) return "-";
    if (rule.use_discount && rule.discount_price) {
      return `R$ ${rule.discount_price.toFixed(2)} (desconto)`;
    }
    return `R$ ${rule.product.price.toFixed(2)} (normal)`;
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Upsell no Checkout
        </CardTitle>
        <CardDescription>
          Configure produtos para serem oferecidos durante o checkout
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={openNewRuleDialog} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Regra de Upsell
        </Button>

        {upsellRules.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma regra de upsell configurada.
          </p>
        ) : (
          <div className="space-y-3">
            {upsellRules.map((rule) => (
              <div 
                key={rule.id} 
                className="flex items-center justify-between p-4 bg-accent rounded-lg border border-border"
              >
                <div className="flex-1">
                  <p className="font-medium">{rule.product?.name || "Produto não encontrado"}</p>
                  <p className="text-sm text-muted-foreground">{getTriggerLabel(rule)}</p>
                  <p className="text-sm text-muted-foreground">{getPriceLabel(rule)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={() => handleToggleActive(rule)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEditRuleDialog(rule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRule ? "Editar" : "Nova"} Regra de Upsell
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveRule} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product">Produto</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - R$ {product.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trigger">Quando exibir</Label>
                <Select value={triggerType} onValueChange={(value: any) => setTriggerType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">Sempre exibir</SelectItem>
                    <SelectItem value="cart_total">Carrinho acima de valor mínimo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {triggerType === "cart_total" && (
                <div className="space-y-2">
                  <Label htmlFor="minCartTotal">Valor mínimo do carrinho (R$)</Label>
                  <Input
                    id="minCartTotal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={minCartTotal}
                    onChange={(e) => setMinCartTotal(e.target.value)}
                    placeholder="50.00"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                <div>
                  <p className="font-medium">Usar preço com desconto</p>
                  <p className="text-sm text-muted-foreground">
                    Oferecer produto com preço especial
                  </p>
                </div>
                <Switch checked={useDiscount} onCheckedChange={setUseDiscount} />
              </div>

              {useDiscount && (
                <div className="space-y-2">
                  <Label htmlFor="discountPrice">Preço com desconto (R$)</Label>
                  <Input
                    id="discountPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="25.00"
                  />
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingRule ? "Atualizar" : "Criar"} Regra
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
