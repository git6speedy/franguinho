import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Ticket, Loader2, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";

interface Coupon {
  id: string;
  code: string;
  type: string;
  discount_type: string | null;
  discount_value: number | null;
  applicable_products: string[];
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
}

export default function Coupons() {
  const { profile } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [type, setType] = useState<"total" | "product" | "frete_gratis">("total");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");

  useEffect(() => {
    if (profile?.store_id) {
      loadCoupons();
      loadProducts();
    }
  }, [profile?.store_id]);

  const loadCoupons = async () => {
    if (!profile?.store_id) return;

    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("store_id", profile.store_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error("Error loading coupons:", error);
      toast.error("Erro ao carregar cupons");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    if (!profile?.store_id) return;

    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .eq("store_id", profile.store_id)
        .eq("active", true)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const handleCreateCoupon = async () => {
    if (!profile?.store_id) return;

    if (!code.trim()) {
      toast.error("Digite o código do cupom");
      return;
    }

    if (type !== "frete_gratis" && (!discountValue || parseFloat(discountValue) <= 0)) {
      toast.error("Digite um valor de desconto válido");
      return;
    }

    if (type === "product" && selectedProducts.length === 0) {
      toast.error("Selecione pelo menos um produto");
      return;
    }

    setCreating(true);

    try {
      const couponData: any = {
        store_id: profile.store_id,
        code: code.toUpperCase().trim(),
        type,
        is_active: true,
      };

      if (type !== "frete_gratis") {
        couponData.discount_type = discountType;
        couponData.discount_value = parseFloat(discountValue);
      }

      if (type === "product") {
        couponData.applicable_products = selectedProducts;
      }

      if (expiresAt) {
        couponData.expires_at = new Date(expiresAt).toISOString();
      }

      if (maxUses) {
        couponData.max_uses = parseInt(maxUses);
      }

      const { error } = await supabase.from("coupons").insert(couponData);

      if (error) {
        if (error.code === "23505") {
          toast.error("Já existe um cupom com este código");
          return;
        }
        throw error;
      }

      toast.success("Cupom criado com sucesso!");
      resetForm();
      setDialogOpen(false);
      loadCoupons();
    } catch (error) {
      console.error("Error creating coupon:", error);
      toast.error("Erro ao criar cupom");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    setDeleting(id);

    try {
      const { error } = await supabase.from("coupons").delete().eq("id", id);

      if (error) throw error;

      toast.success("Cupom excluído com sucesso!");
      setCoupons(coupons.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast.error("Erro ao excluir cupom");
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setCode("");
    setType("total");
    setDiscountType("percent");
    setDiscountValue("");
    setSelectedProducts([]);
    setExpiresAt("");
    setMaxUses("");
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "total":
        return "Desconto Total";
      case "product":
        return "Produto Específico";
      case "frete_gratis":
        return "Frete Grátis";
      default:
        return type;
    }
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.type === "frete_gratis") return "Frete Grátis";
    if (!coupon.discount_value) return "-";
    if (coupon.discount_type === "percent") {
      return `${coupon.discount_value}%`;
    }
    return `R$ ${coupon.discount_value.toFixed(2)}`;
  };

  const getRemainingUses = (coupon: Coupon) => {
    if (!coupon.max_uses) return "Ilimitado";
    const remaining = coupon.max_uses - coupon.current_uses;
    return `${remaining}/${coupon.max_uses}`;
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.expires_at) return false;
    return new Date(coupon.expires_at) < new Date();
  };

  const isExhausted = (coupon: Coupon) => {
    if (!coupon.max_uses) return false;
    return coupon.current_uses >= coupon.max_uses;
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Cupons de Desconto</h1>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 transition-all hover:scale-105">
              <Plus className="h-4 w-4" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Cupom</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Código do Cupom</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ex: DESCONTO10"
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Cupom</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total">Desconto no Total</SelectItem>
                    <SelectItem value="product">Produto Específico</SelectItem>
                    <SelectItem value="frete_gratis">Frete Grátis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {type !== "frete_gratis" && (
                <>
                  <div className="space-y-2">
                    <Label>Tipo de Desconto</Label>
                    <Select
                      value={discountType}
                      onValueChange={(v: any) => setDiscountType(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Valor do Desconto{" "}
                      {discountType === "percent" ? "(%)" : "(R$)"}
                    </Label>
                    <Input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "percent" ? "10" : "5.00"}
                      min="0"
                      step={discountType === "percent" ? "1" : "0.01"}
                    />
                  </div>
                </>
              )}

              {type === "product" && (
                <div className="space-y-2">
                  <Label>Produtos Aplicáveis</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {products.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum produto encontrado
                      </p>
                    ) : (
                      products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            id={product.id}
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() =>
                              toggleProductSelection(product.id)
                            }
                          />
                          <label
                            htmlFor={product.id}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {product.name}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedProducts.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedProducts.length} produto(s) selecionado(s)
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Data de Expiração (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Limite de Usos (opcional)</Label>
                <Input
                  type="number"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Deixe vazio para ilimitado"
                  min="1"
                />
              </div>

              <Button
                onClick={handleCreateCoupon}
                disabled={creating}
                className="w-full gap-2 transition-all hover:scale-[1.02]"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {creating ? "Criando..." : "Criar Cupom"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cupons Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cupom cadastrado</p>
              <p className="text-sm">Crie seu primeiro cupom de desconto</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Expiração</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow
                      key={coupon.id}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-mono font-semibold">
                        {coupon.code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {coupon.type === "product" && (
                            <Package className="h-4 w-4 text-muted-foreground" />
                          )}
                          {getTypeLabel(coupon.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {getDiscountDisplay(coupon)}
                      </TableCell>
                      <TableCell>
                        {coupon.expires_at
                          ? format(
                              new Date(coupon.expires_at),
                              "dd/MM/yyyy HH:mm",
                              { locale: ptBR }
                            )
                          : "Sem expiração"}
                      </TableCell>
                      <TableCell>{getRemainingUses(coupon)}</TableCell>
                      <TableCell>
                        {isExpired(coupon) ? (
                          <Badge
                            variant="destructive"
                            className="animate-in fade-in"
                          >
                            Expirado
                          </Badge>
                        ) : isExhausted(coupon) ? (
                          <Badge
                            variant="secondary"
                            className="animate-in fade-in"
                          >
                            Esgotado
                          </Badge>
                        ) : coupon.is_active ? (
                          <Badge
                            variant="default"
                            className="bg-green-500 animate-in fade-in"
                          >
                            Ativo
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="animate-in fade-in"
                          >
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          disabled={deleting === coupon.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                        >
                          {deleting === coupon.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
