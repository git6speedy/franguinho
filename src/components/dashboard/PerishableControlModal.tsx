import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, 
  Users, 
  Search, 
  Plus, 
  Minus, 
  X, 
  Lightbulb,
  Cloud,
  Calendar,
  DollarSign,
  Car,
  PartyPopper
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PerishableControlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashRegisterId?: string;
  onSave?: () => void;
  onCancel?: () => void;
  existingRecordId?: string;
}

interface PerishableProduct {
  id: string;
  name: string;
  has_variations: boolean;
  variations?: { id: string; name: string }[];
}

interface SelectedItem {
  productId: string;
  productName: string;
  variationId?: string;
  variationName?: string;
  quantity: number;
}

const CONTEXT_TAGS = [
  { label: "Chuva Forte", icon: Cloud },
  { label: "Feriado", icon: PartyPopper },
  { label: "Pagamento de Salário", icon: DollarSign },
  { label: "Trânsito Intenso", icon: Car },
  { label: "Evento na Cidade", icon: Calendar },
];

export default function PerishableControlModal({
  open,
  onOpenChange,
  cashRegisterId,
  onSave,
  onCancel,
  existingRecordId,
}: PerishableControlModalProps) {
  const [products, setProducts] = useState<PerishableProduct[]>([]);
  const [searchSobras, setSearchSobras] = useState("");
  const [searchFaltas, setSearchFaltas] = useState("");
  const [sobrasItems, setSobrasItems] = useState<SelectedItem[]>([]);
  const [faltasItems, setFaltasItems] = useState<SelectedItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (open && profile?.store_id) {
      loadPerishableProducts();
      if (existingRecordId) {
        loadExistingRecord();
      }
    }
  }, [open, profile?.store_id, existingRecordId]);

  const loadPerishableProducts = async () => {
    if (!profile?.store_id) return;
    setLoading(true);

    try {
      // First, get all perishable products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, has_variations")
        .eq("store_id", profile.store_id)
        .eq("is_perishable", true)
        .eq("active", true);

      if (productsError) throw productsError;

      if (!productsData || productsData.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Then get variations for products that have them
      const productsWithVariations = productsData.filter(p => p.has_variations);
      
      let variationsMap = new Map();
      if (productsWithVariations.length > 0) {
        const productIds = productsWithVariations.map(p => p.id);
        const { data: variationsData, error: variationsError } = await supabase
          .from("product_variations")
          .select("id, name, product_id")
          .in("product_id", productIds);

        if (variationsError) {
          console.error("Error loading variations:", variationsError);
        } else if (variationsData) {
          variationsData.forEach(v => {
            if (!variationsMap.has(v.product_id)) {
              variationsMap.set(v.product_id, []);
            }
            variationsMap.get(v.product_id).push({ id: v.id, name: v.name });
          });
        }
      }

      // Combine products with their variations
      const formattedProducts = productsData.map(p => ({
        id: p.id,
        name: p.name,
        has_variations: p.has_variations || false,
        variations: variationsMap.get(p.id) || []
      }));

      setProducts(formattedProducts);
    } catch (error: any) {
      toast.error("Erro ao carregar produtos perecíveis");
      console.error("Error loading perishable products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingRecord = async () => {
    if (!existingRecordId) return;

    const { data: record, error: recordError } = await supabase
      .from("perishable_records")
      .select("context_tags")
      .eq("id", existingRecordId)
      .single();

    if (recordError) {
      console.error(recordError);
      return;
    }

    setSelectedTags(record.context_tags || []);

    const { data: items, error: itemsError } = await supabase
      .from("perishable_record_items")
      .select(`
        id,
        product_id,
        product_variation_id,
        item_type,
        quantity,
        products (name),
        product_variations (name)
      `)
      .eq("perishable_record_id", existingRecordId);

    if (itemsError) {
      console.error(itemsError);
      return;
    }

    const sobras: SelectedItem[] = [];
    const faltas: SelectedItem[] = [];

    items?.forEach((item: any) => {
      const selectedItem: SelectedItem = {
        productId: item.product_id,
        productName: item.products?.name || "",
        variationId: item.product_variation_id,
        variationName: item.product_variations?.name,
        quantity: item.quantity,
      };

      if (item.item_type === "sobra") {
        sobras.push(selectedItem);
      } else {
        faltas.push(selectedItem);
      }
    });

    setSobrasItems(sobras);
    setFaltasItems(faltas);
  };

  const handleAddItem = (
    type: "sobras" | "faltas",
    product: PerishableProduct,
    variation?: { id: string; name: string }
  ) => {
    const newItem: SelectedItem = {
      productId: product.id,
      productName: product.name,
      variationId: variation?.id,
      variationName: variation?.name,
      quantity: 1,
    };

    const setItems = type === "sobras" ? setSobrasItems : setFaltasItems;
    const items = type === "sobras" ? sobrasItems : faltasItems;

    // Check if already exists
    const exists = items.some(
      (i) => i.productId === product.id && i.variationId === variation?.id
    );

    if (!exists) {
      setItems([...items, newItem]);
    }
  };

  const handleRemoveItem = (type: "sobras" | "faltas", index: number) => {
    const setItems = type === "sobras" ? setSobrasItems : setFaltasItems;
    const items = type === "sobras" ? sobrasItems : faltasItems;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (
    type: "sobras" | "faltas",
    index: number,
    delta: number
  ) => {
    const setItems = type === "sobras" ? setSobrasItems : setFaltasItems;
    const items = type === "sobras" ? sobrasItems : faltasItems;

    const newItems = [...items];
    newItems[index].quantity = Math.max(0, newItems[index].quantity + delta);
    setItems(newItems);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!profile?.store_id) return;
    setSaving(true);

    try {
      let recordId = existingRecordId;

      if (existingRecordId) {
        // Update existing record
        await supabase
          .from("perishable_records")
          .update({ context_tags: selectedTags, updated_at: new Date().toISOString() })
          .eq("id", existingRecordId);

        // Delete old items
        await supabase
          .from("perishable_record_items")
          .delete()
          .eq("perishable_record_id", existingRecordId);
      } else {
        // Create new record
        const { data: newRecord, error: recordError } = await supabase
          .from("perishable_records")
          .insert({
            store_id: profile.store_id,
            cash_register_id: cashRegisterId,
            context_tags: selectedTags,
          })
          .select()
          .single();

        if (recordError) throw recordError;
        recordId = newRecord.id;
      }

      // Insert items
      const allItems = [
        ...sobrasItems.map((item) => ({
          perishable_record_id: recordId,
          product_id: item.productId,
          product_variation_id: item.variationId || null,
          item_type: "sobra",
          quantity: item.quantity,
        })),
        ...faltasItems.map((item) => ({
          perishable_record_id: recordId,
          product_id: item.productId,
          product_variation_id: item.variationId || null,
          item_type: "falta",
          quantity: item.quantity,
        })),
      ].filter((item) => item.quantity > 0);

      if (allItems.length > 0) {
        const { error: itemsError } = await supabase
          .from("perishable_record_items")
          .insert(allItems);

        if (itemsError) throw itemsError;
      }

      toast.success("Controle de perecíveis salvo!");
      onSave?.();
      resetAndClose();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    resetAndClose();
  };

  const resetAndClose = () => {
    setSobrasItems([]);
    setFaltasItems([]);
    setSelectedTags([]);
    setSearchSobras("");
    setSearchFaltas("");
    onOpenChange(false);
  };

  const filteredProducts = (search: string) =>
    products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );

  const renderProductList = (
    type: "sobras" | "faltas",
    search: string,
    setSearch: (s: string) => void
  ) => {
    const filtered = filteredProducts(search);

    return (
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <ScrollArea className="h-32 border rounded-md p-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum produto perecível encontrado
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((product) => (
                <div key={product.id}>
                  {product.has_variations && product.variations?.length ? (
                    product.variations.map((variation) => (
                      <Button
                        key={variation.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left h-auto py-1"
                        onClick={() => handleAddItem(type, product, variation)}
                      >
                        <Plus className="h-3 w-3 mr-2 shrink-0" />
                        <span className="truncate">
                          {product.name} - {variation.name}
                        </span>
                      </Button>
                    ))
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-1"
                      onClick={() => handleAddItem(type, product)}
                    >
                      <Plus className="h-3 w-3 mr-2 shrink-0" />
                      <span className="truncate">{product.name}</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  };

  const renderSelectedItems = (type: "sobras" | "faltas") => {
    const items = type === "sobras" ? sobrasItems : faltasItems;

    if (items.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-2">
          Nenhum item adicionado
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={`${item.productId}-${item.variationId || "base"}`}
            className="flex items-center justify-between gap-2 p-2 bg-accent rounded-md"
          >
            <span className="text-sm truncate flex-1">
              {item.productName}
              {item.variationName && ` - ${item.variationName}`}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleQuantityChange(type, index, -1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm font-medium">
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleQuantityChange(type, index, 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => handleRemoveItem(type, index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const hasSobras = sobrasItems.some((i) => i.quantity > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Controle de Perecíveis
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sobras */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <Label className="font-semibold">Sobras</Label>
              </div>
              {renderProductList("sobras", searchSobras, setSearchSobras)}
              {renderSelectedItems("sobras")}
              {hasSobras && (
                <div className="flex items-start gap-2 p-2 bg-amber-500/10 rounded-md border border-amber-500/20">
                  <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Sugestão: Verificar receitas de reaproveitamento
                  </p>
                </div>
              )}
            </div>

            {/* Faltas */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-red-500" />
                <Label className="font-semibold">Faltas</Label>
                <span className="text-xs text-muted-foreground">
                  (Clientes que vieram após acabar)
                </span>
              </div>
              {renderProductList("faltas", searchFaltas, setSearchFaltas)}
              {renderSelectedItems("faltas")}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Contexto do Dia */}
          <div className="space-y-3">
            <Label className="font-semibold">Fatores que influenciaram hoje:</Label>
            <div className="flex flex-wrap gap-2">
              {CONTEXT_TAGS.map((tag) => {
                const Icon = tag.icon;
                const isSelected = selectedTags.includes(tag.label);
                return (
                  <Badge
                    key={tag.label}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all",
                      isSelected && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => toggleTag(tag.label)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {tag.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}