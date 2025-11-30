import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { supabase as sb } from "@/integrations/supabase/client";

const supabase: any = sb;

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  stock_quantity?: number;
  has_variations?: boolean;
  earns_loyalty_points?: boolean;
  loyalty_points_value?: number;
  can_be_redeemed_with_points?: boolean;
  redemption_points_cost?: number;
}

interface UpsellRule {
  id: string;
  product_id: string;
  use_discount: boolean;
  discount_price?: number;
  product?: Product;
}

interface UpsellModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  cartTotal: number;
  onAddProduct: (product: Product, price: number) => void;
}

export default function UpsellModal({ isOpen, onClose, storeId, cartTotal, onAddProduct }: UpsellModalProps) {
  const [upsellRules, setUpsellRules] = useState<UpsellRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedProductIds, setAddedProductIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && storeId) {
      loadUpsellRules();
    }
  }, [isOpen, storeId, cartTotal]);

  const loadUpsellRules = async () => {
    setLoading(true);

    // Load active upsell rules that match the conditions
    const { data, error } = await supabase
      .from("upsell_rules")
      .select(`
        *,
        product:products(id, name, price, image_url, stock_quantity, has_variations, earns_loyalty_points, loyalty_points_value, can_be_redeemed_with_points, redemption_points_cost)
      `)
      .eq("store_id", storeId)
      .eq("is_active", true);

    if (error) {
      console.error("Erro ao carregar regras de upsell:", error);
      setLoading(false);
      return;
    }

    // Filter rules based on cart total
    const filteredRules = (data || []).filter((rule: any) => {
      if (rule.trigger_type === "always") return true;
      if (rule.trigger_type === "cart_total") {
        return cartTotal >= (rule.min_cart_total || 0);
      }
      return false;
    });

    setUpsellRules(filteredRules);
    setLoading(false);
  };

  const handleAddProduct = (rule: UpsellRule) => {
    if (!rule.product) return;

    const price = rule.use_discount && rule.discount_price 
      ? rule.discount_price 
      : rule.product.price;

    onAddProduct(rule.product, price);
    
    // Mark this product as added
    setAddedProductIds(prev => new Set([...prev, rule.product_id]));
    
    // Check if there are remaining products to show
    const remainingRules = upsellRules.filter(r => r.product_id !== rule.product_id);
    if (remainingRules.length === 0) {
      // No more products to show, close modal
      onClose();
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carregando ofertas...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  // Filter out products that have been added
  const availableRules = upsellRules.filter(rule => !addedProductIds.has(rule.product_id));

  if (availableRules.length === 0) {
    return null; // Don't show modal if no upsell rules remain
  }

  const hasAddedProducts = addedProductIds.size > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Que tal adicionar algo mais?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Aproveite essas ofertas especiais:
          </p>
          <div className={`grid grid-cols-1 ${availableRules.length > 1 ? 'md:grid-cols-2' : ''} gap-4`}>
            {availableRules.map((rule) => {
              if (!rule.product) return null;
              
              const displayPrice = rule.use_discount && rule.discount_price 
                ? rule.discount_price 
                : rule.product.price;

              const hasDiscount = rule.use_discount && rule.discount_price && rule.discount_price < rule.product.price;

              return (
                <div 
                  key={rule.id} 
                  className="border border-border rounded-lg p-4 space-y-3 bg-accent"
                >
                  {rule.product.image_url && (
                    <div className="w-full h-32 overflow-hidden rounded-md">
                      <img 
                        src={rule.product.image_url} 
                        alt={rule.product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium">{rule.product.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {hasDiscount && (
                        <>
                          <span className="text-sm text-muted-foreground line-through">
                            R$ {rule.product.price.toFixed(2)}
                          </span>
                          <Badge variant="destructive" className="text-xs">
                            Desconto!
                          </Badge>
                        </>
                      )}
                      <p className="text-lg font-bold text-primary">
                        R$ {displayPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleAddProduct(rule)} 
                    className="w-full"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              {hasAddedProducts ? "Satisfeito" : "Não, obrigado"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
