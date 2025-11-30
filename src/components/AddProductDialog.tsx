import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: () => void;
  categories: Array<{ id: string; name: string }>;
}

export default function AddProductDialog({ open, onOpenChange, onProductAdded, categories }: AddProductDialogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductImageUrl, setNewProductImageUrl] = useState("");
  const [newProductCategoryId, setNewProductCategoryId] = useState("");
  const [newProductLoyaltyPointsValue, setNewProductLoyaltyPointsValue] = useState("0.0");
  const [newProductHasVariations, setNewProductHasVariations] = useState(false);
  const [newProductStockQuantity, setNewProductStockQuantity] = useState("0");
  const [newProductCanBeRedeemed, setNewProductCanBeRedeemed] = useState(false);
  const [newProductRedemptionCost, setNewProductRedemptionCost] = useState("0");
  const [newProductCostPrice, setNewProductCostPrice] = useState("0.00");
  const [newProductIfoodPrice, setNewProductIfoodPrice] = useState("");
  const [newProductIsPerishable, setNewProductIsPerishable] = useState(false);

  const resetForm = () => {
    setNewProductName("");
    setNewProductPrice("");
    setNewProductImageUrl("");
    setNewProductCategoryId("");
    setNewProductLoyaltyPointsValue("0.0");
    setNewProductHasVariations(false);
    setNewProductStockQuantity("0");
    setNewProductCanBeRedeemed(false);
    setNewProductRedemptionCost("0");
    setNewProductCostPrice("0.00");
    setNewProductIfoodPrice("");
    setNewProductIsPerishable(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.store_id) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Você precisa estar vinculado a uma loja",
      });
      return;
    }

    const loyaltyValue = parseFloat(newProductLoyaltyPointsValue);
    const earnsLoyalty = loyaltyValue > 0;
    const redemptionCost = parseFloat(newProductRedemptionCost);

    const { error } = await supabase.from("products").insert({
      store_id: profile.store_id,
      name: newProductName,
      price: newProductHasVariations ? 0 : parseFloat(newProductPrice),
      ifood_price: newProductIfoodPrice ? parseFloat(newProductIfoodPrice) : null,
      image_url: newProductImageUrl || null,
      category_id: newProductCategoryId && newProductCategoryId !== "none" ? newProductCategoryId : null,
      stock_quantity: newProductHasVariations ? 0 : parseInt(newProductStockQuantity || "0"),
      earns_loyalty_points: earnsLoyalty,
      loyalty_points_value: loyaltyValue,
      has_variations: newProductHasVariations,
      can_be_redeemed_with_points: newProductCanBeRedeemed,
      redemption_points_cost: newProductCanBeRedeemed ? redemptionCost : 0,
      cost_price: parseFloat(newProductCostPrice),
      is_perishable: newProductIsPerishable,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao adicionar produto",
        description: error.message,
      });
      return;
    }

    toast({
      title: "Produto adicionado com sucesso!",
    });
    resetForm();
    onOpenChange(false);
    onProductAdded();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newProductName">Nome do Produto</Label>
              <Input
                id="newProductName"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Ex: Frango com Recheio"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newProductPrice">Preço (R$)</Label>
              <Input
                id="newProductPrice"
                type="number"
                step="0.01"
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                placeholder="25.90"
                required
                disabled={newProductHasVariations}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newProductIfoodPrice">Preço Ifood (R$)</Label>
              <Input
                id="newProductIfoodPrice"
                type="number"
                step="0.01"
                value={newProductIfoodPrice}
                onChange={(e) => setNewProductIfoodPrice(e.target.value)}
                placeholder="Opcional"
                disabled={newProductHasVariations}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newProductCostPrice">Preço de Custo (R$)</Label>
            <Input
              id="newProductCostPrice"
              type="number"
              step="0.01"
              value={newProductCostPrice}
              onChange={(e) => setNewProductCostPrice(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newProductImage">URL da Imagem (opcional)</Label>
              <Input
                id="newProductImage"
                type="url"
                value={newProductImageUrl}
                onChange={(e) => setNewProductImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newProductCategory">Categoria</Label>
              <Select value={newProductCategoryId} onValueChange={setNewProductCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem Categoria</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newProductLoyaltyPoints">Pontos de Fidelidade (Ganhos)</Label>
              <Input
                id="newProductLoyaltyPoints"
                type="number"
                step="0.01"
                min="0"
                value={newProductLoyaltyPointsValue}
                onChange={(e) => setNewProductLoyaltyPointsValue(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newProductStockQuantity">Estoque Inicial</Label>
              <Input
                id="newProductStockQuantity"
                type="number"
                min="0"
                value={newProductStockQuantity}
                onChange={(e) => setNewProductStockQuantity(e.target.value)}
                placeholder="0"
                required
                disabled={newProductHasVariations}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="newProductHasVariations"
                checked={newProductHasVariations}
                onCheckedChange={setNewProductHasVariations}
              />
              <Label htmlFor="newProductHasVariations">Possui Variações?</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="newProductCanBeRedeemed"
                checked={newProductCanBeRedeemed}
                onCheckedChange={setNewProductCanBeRedeemed}
              />
              <Label htmlFor="newProductCanBeRedeemed">Pode ser resgatado com pontos?</Label>
            </div>
          </div>
          
          {newProductCanBeRedeemed && (
            <div className="space-y-2">
              <Label htmlFor="newProductRedemptionCost">Custo em Pontos para Resgate</Label>
              <Input
                id="newProductRedemptionCost"
                type="number"
                min="0"
                value={newProductRedemptionCost}
                onChange={(e) => setNewProductRedemptionCost(e.target.value)}
                placeholder="0"
              />
            </div>
          )}
          
          <Button type="submit" className="w-full">Adicionar Produto</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
