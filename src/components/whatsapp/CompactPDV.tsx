import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  X, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Star,
  Search,
  Gift,
  MapPin,
  Clock,
  QrCode,
  CreditCard,
  Banknote,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useOrderFlow } from "@/hooks/useOrderFlow";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ProductCardWithVariations from "@/components/ProductCardWithVariations";
import { printOrder } from "@/utils/printUtils";
import MultiPaymentDialog, { PaymentSelection } from "@/components/pdv/MultiPaymentDialog";
import CouponInput from "@/components/CouponInput";
import { useCoupon } from "@/hooks/useCoupon";

interface CompactPDVProps {
  clientNumber: string;
  onClose: () => void;
}

interface PDVProduct {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  has_variations: boolean;
  category_id?: string;
  can_be_redeemed_with_points: boolean;
  redemption_points_cost: number;
  earns_loyalty_points?: boolean;
  loyalty_points_value?: number;
  min_variation_price?: number;
  max_variation_price?: number;
}

interface Variation {
  id: string;
  product_id: string;
  name: string;
  price_adjustment: number;
  stock_quantity: number;
  is_composite?: boolean;
}

interface CartItem extends PDVProduct {
  quantity: number;
  selectedVariation?: Variation;
  isRedeemedWithPoints: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface CustomerAddress {
  id: string;
  customer_id: string;
  name: string;
  address: string;
  number: string;
  neighborhood: string;
  reference: string;
  cep: string;
}

const CompactPDV = ({ clientNumber, onClose }: CompactPDVProps) => {
  const { profile } = useAuth();
  const { paymentMethods, cardMachines } = usePaymentMethods();
  const { getInitialStatus } = useOrderFlow();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<PDVProduct[]>([]);
  const [allVariations, setAllVariations] = useState<Variation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([]);
  
  // Customer info
  const [customer, setCustomer] = useState<any>(null);
  const [customerPoints, setCustomerPoints] = useState(0);
  const [customerOrderCount, setCustomerOrderCount] = useState(0);
  
  // Payment and delivery
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credito" | "debito" | "dinheiro" | "reserva" | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [isMultiPaymentMode, setIsMultiPaymentMode] = useState(false);
  const [showMultiPaymentDialog, setShowMultiPaymentDialog] = useState(false);
  const [multiPaymentSelections, setMultiPaymentSelections] = useState<PaymentSelection[]>([]);
  const [changeFor, setChangeFor] = useState("");
  const [isDelivery, setIsDelivery] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState("");
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [isReserva, setIsReserva] = useState(false);
  const [reservaPickupTime, setReservaPickupTime] = useState("");
  
  // Address
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    name: "",
    address: "",
    number: "",
    neighborhood: "",
    reference: "",
    cep: "",
  });
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  
  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Coupon system
  const [appliedCouponData, setAppliedCouponData] = useState<{
    discountAmount: number;
    freeShipping: boolean;
    couponId: string;
    couponCode: string;
  } | null>(null);
  const { registerCouponUse } = useCoupon(profile?.store_id);

  // Load favorites from localStorage
  useEffect(() => {
    const storedFavorites = localStorage.getItem('whatsapp_pdv_favorites');
    if (storedFavorites) {
      setFavoriteProductIds(JSON.parse(storedFavorites));
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (!profile?.store_id) return;
    loadProducts();
    loadCategories();
    loadCustomerInfo();
    loadCartFromLocalStorage();
  }, [profile?.store_id, clientNumber]);

  // Load customer addresses when customer is found
  useEffect(() => {
    if (customer?.id) {
      loadCustomerAddresses();
    }
  }, [customer]);

  const loadProducts = async () => {
    if (!profile?.store_id) return;

    const { data: productsData } = await supabase
      .from("products")
      .select("id, name, price, stock_quantity, has_variations, category_id, can_be_redeemed_with_points, redemption_points_cost")
      .eq("store_id", profile.store_id)
      .eq("active", true)
      .order("name");

    if (productsData) {
      const productIdsWithVariations = productsData.filter((p: PDVProduct) => p.has_variations).map((p: PDVProduct) => p.id);
      
      if (productIdsWithVariations.length > 0) {
        const { data: variationsData } = await supabase
          .from("product_variations")
          .select("*")
          .in("product_id", productIdsWithVariations)
          .order("name");

        if (variationsData) {
          setAllVariations(variationsData);
          
          // Calculate min/max prices for products with variations
          const variationsByProductId = new Map<string, Variation[]>();
          variationsData.forEach(v => {
            const existing = variationsByProductId.get(v.product_id) || [];
            existing.push(v);
            variationsByProductId.set(v.product_id, existing);
          });

          const productsWithCalculatedPrices = productsData.map((product: PDVProduct) => {
            if (product.has_variations) {
              const productVariations = variationsByProductId.get(product.id) || [];
              if (productVariations.length > 0) {
                const finalPrices = productVariations.map(v => product.price + v.price_adjustment);
                product.min_variation_price = Math.min(...finalPrices);
                product.max_variation_price = Math.max(...finalPrices);
              }
            }
            return product;
          });
          
          setProducts(productsWithCalculatedPrices);
        }
      } else {
        setProducts(productsData);
      }
    }
  };

  const loadCategories = async () => {
    if (!profile?.store_id) return;

    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .eq("store_id", profile.store_id)
      .order("name");

    setCategories(data || []);
  };

  const loadCustomerInfo = async () => {
    if (!profile?.store_id) return;

    // Get customer from phone
    const { data: customerData } = await supabase
      .from("customers")
      .select("*")
      .eq("store_id", profile.store_id)
      .eq("phone", clientNumber)
      .maybeSingle();

    if (customerData) {
      setCustomer(customerData);
      setCustomerPoints(customerData.points || 0);
      
      // Get order count
      const { count } = await supabase
        .from("orders")
        .select("*", { count: 'exact', head: true })
        .eq("store_id", profile.store_id)
        .eq("customer_id", customerData.id);
      
      setCustomerOrderCount(count || 0);
    }
  };

  const loadCart = async () => {
    if (!profile?.store_id) return;

    const { data } = await supabase
      .from("whatsapp_carts")
      .select("items")
      .eq("store_id", profile.store_id)
      .eq("client_number", clientNumber)
      .maybeSingle();

    if (data?.items && Array.isArray(data.items)) {
      setCart(data.items as unknown as CartItem[]);
    }
  };

  const loadCustomerAddresses = async () => {
    if (!customer?.id) return;

    const { data } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", customer.id)
      .order("name");

    setSavedAddresses(data || []);
  };

  // Carregar carrinho do localStorage
  const loadCartFromLocalStorage = () => {
    const cartKey = `whatsapp_cart_${profile?.store_id}_${clientNumber}`;
    const savedCart = localStorage.getItem(cartKey);
    
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
      }
    }
  };

  // Salvar carrinho no localStorage sempre que mudar
  useEffect(() => {
    if (!profile?.store_id) return;
    
    const cartKey = `whatsapp_cart_${profile.store_id}_${clientNumber}`;
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, profile?.store_id, clientNumber]);

  const clearCart = () => {
    if (!profile?.store_id) return;
    
    const confirmed = window.confirm("Tem certeza que deseja limpar o carrinho?");
    if (!confirmed) return;
    
    setCart([]);
    const cartKey = `whatsapp_cart_${profile.store_id}_${clientNumber}`;
    localStorage.removeItem(cartKey);
    toast.success("Carrinho limpo com sucesso!");
  };

  const toggleFavorite = (productId: string) => {
    const newFavorites = favoriteProductIds.includes(productId)
      ? favoriteProductIds.filter(id => id !== productId)
      : [...favoriteProductIds, productId];

    setFavoriteProductIds(newFavorites);
    localStorage.setItem('whatsapp_pdv_favorites', JSON.stringify(newFavorites));
  };

  const handleAddToCart = (product: PDVProduct, variation?: Variation, redeemWithPoints = false) => {
    const existingIndex = cart.findIndex(
      item => 
        item.id === product.id && 
        item.selectedVariation?.id === variation?.id &&
        item.isRedeemedWithPoints === redeemWithPoints
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        ...product,
        quantity: 1,
        selectedVariation: variation,
        isRedeemedWithPoints: redeemWithPoints,
      }]);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }
    
    setCart(newCart);
  };

  const removeItem = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  // Calculate totals
  const totalMonetary = useMemo(() => {
    return cart.reduce((sum, item) => {
      if (item.isRedeemedWithPoints) return sum;
      
      const itemPrice = item.selectedVariation 
        ? item.price + item.selectedVariation.price_adjustment 
        : item.price;
      return sum + (itemPrice * item.quantity);
    }, 0);
  }, [cart]);

  const pointsToRedeem = useMemo(() => {
    return cart.reduce((sum, item) => {
      if (!item.isRedeemedWithPoints) return sum;
      return sum + (item.redemption_points_cost * item.quantity);
    }, 0);
  }, [cart]);

  const discountAmount = parseFloat(discount) || 0;
  const couponDiscountAmount = appliedCouponData?.discountAmount || 0;
  const deliveryFeeAmount = appliedCouponData?.freeShipping ? 0 : (parseFloat(deliveryFee) || 0);
  const finalTotal = Math.max(0, totalMonetary - discountAmount - couponDiscountAmount + deliveryFeeAmount);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategoryId) {
      filtered = filtered.filter(p => p.category_id === selectedCategoryId);
    }

    return filtered;
  }, [products, searchTerm, selectedCategoryId]);

  // Group products by category with favorites first
  const productsByCategory = useMemo(() => {
    const grouped: { [key: string]: PDVProduct[] } = {};
    
    const favorites = filteredProducts.filter(p => favoriteProductIds.includes(p.id));
    const nonFavorites = filteredProducts.filter(p => !favoriteProductIds.includes(p.id));

    if (favorites.length > 0) {
      grouped["⭐ Favoritos"] = favorites;
    }

    nonFavorites.forEach(product => {
      const categoryName = categories.find(cat => cat.id === product.category_id)?.name || "Sem Categoria";
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(product);
    });

    return grouped;
  }, [filteredProducts, favoriteProductIds, categories]);

  const handleFinalizeSale = async () => {
    if (cart.length === 0) {
      toast.error("Adicione produtos ao carrinho");
      return;
    }

    // Modo múltiplo pagamento - só abre dialog se ainda não selecionou pagamentos
    if (isMultiPaymentMode && multiPaymentSelections.length === 0) {
      setShowMultiPaymentDialog(true);
      return;
    }

    if (!paymentMethod && !selectedPaymentMethodId && !isReserva && multiPaymentSelections.length === 0) {
      toast.error("Selecione uma forma de pagamento");
      return;
    }

    if (isDelivery && !selectedAddressId && (!newAddress.address || !newAddress.neighborhood)) {
      toast.error("Preencha o endereço de entrega");
      return;
    }

    if (pointsToRedeem > customerPoints) {
      toast.error(`Cliente não possui pontos suficientes. Disponível: ${customerPoints}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Get cash register
      const { data: cashRegister } = await supabase
        .from("cash_register")
        .select("id")
        .eq("store_id", profile.store_id)
        .is("closed_at", null)
        .maybeSingle();

      // Generate order number
      const orderNumber = `WA-${Date.now()}`;

      // Get selected address
      let deliveryAddress = null;
      if (isDelivery) {
        if (selectedAddressId) {
          const addr = savedAddresses.find(a => a.id === selectedAddressId);
          if (addr) {
            deliveryAddress = {
              address: addr.address,
              number: addr.number,
              neighborhood: addr.neighborhood,
              reference: addr.reference,
              cep: addr.cep,
            };
          }
        } else {
          deliveryAddress = newAddress;
        }
      }

      // Create customer if doesn't exist
      let customerId = customer?.id;
      if (!customerId) {
        const { data: newCustomer } = await supabase
          .from("customers")
          .insert({
            store_id: profile.store_id,
            phone: clientNumber,
            name: customer?.name || "Cliente WhatsApp",
            points: 0,
          })
          .select()
          .single();
        
        if (newCustomer) {
          customerId = newCustomer.id;
          setCustomer(newCustomer);
        }
      }

      const paymentMethodLabels: Record<string, string> = {
        pix: "PIX",
        credito: "Crédito",
        debito: "Débito",
        dinheiro: "Dinheiro",
        reserva: "Reserva",
      };

      // Preparar dados de pagamento
      let finalPaymentMethod = "";
      let paymentMethodsArray: string[] | null = null;
      let paymentAmountsArray: number[] | null = null;
      let cardMachineIdsArray: string[] | null = null;

      if (isMultiPaymentMode && multiPaymentSelections.length > 0) {
        // Múltiplos pagamentos
        paymentMethodsArray = multiPaymentSelections.map(p => p.methodName);
        paymentAmountsArray = multiPaymentSelections.map(p => p.amount);
        cardMachineIdsArray = multiPaymentSelections
          .map(p => p.cardMachineId)
          .filter((id): id is string => !!id);
        finalPaymentMethod = paymentMethodsArray.join(" + ");
      } else if (isReserva) {
        finalPaymentMethod = "Reserva";
      } else if (paymentMethod) {
        finalPaymentMethod = paymentMethodLabels[paymentMethod] || paymentMethod;
      } else if (selectedPaymentMethodId) {
        finalPaymentMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethodId)?.name || "";
      }

      const initialStatus = getInitialStatus();
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          store_id: profile.store_id,
          customer_id: customerId,
          order_number: orderNumber,
          source: "whatsapp",
          status: initialStatus,
          total: finalTotal,
          payment_method: finalPaymentMethod,
          payment_methods: paymentMethodsArray,
          payment_amounts: paymentAmountsArray,
          card_machine_ids: cardMachineIdsArray && cardMachineIdsArray.length > 0 ? cardMachineIdsArray : null,
          change_for: changeFor ? parseFloat(changeFor) : null,
          delivery: isDelivery,
          delivery_fee: deliveryFeeAmount || null,
          delivery_address: deliveryAddress?.address || null,
          delivery_number: deliveryAddress?.number || null,
          delivery_neighborhood: deliveryAddress?.neighborhood || null,
          delivery_reference: deliveryAddress?.reference || null,
          delivery_cep: deliveryAddress?.cep || null,
          discount_amount: (discountAmount + couponDiscountAmount) || null,
          notes: notes || null,
          cash_register_id: cashRegister?.id || null,
          pickup_time: isReserva ? reservaPickupTime : null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_variation_id: item.selectedVariation?.id || null,
        variation_name: item.selectedVariation?.name || null,
        quantity: item.quantity,
        product_price: item.selectedVariation 
          ? item.price + item.selectedVariation.price_adjustment 
          : item.price,
        subtotal: (item.selectedVariation 
          ? item.price + item.selectedVariation.price_adjustment 
          : item.price) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update stock
      for (const item of cart) {
        if (item.has_variations && item.selectedVariation) {
          const { data: variation } = await supabase
            .from("product_variations")
            .select("stock_quantity")
            .eq("id", item.selectedVariation.id)
            .single();

          if (variation) {
            await supabase
              .from("product_variations")
              .update({ stock_quantity: Math.max(0, variation.stock_quantity - item.quantity) })
              .eq("id", item.selectedVariation.id);
          }
        } else {
          const { data: product } = await supabase
            .from("products")
            .select("stock_quantity")
            .eq("id", item.id)
            .single();

          if (product) {
            await supabase
              .from("products")
              .update({ stock_quantity: Math.max(0, product.stock_quantity - item.quantity) })
              .eq("id", item.id);
          }
        }
      }

      // Handle loyalty points
      if (pointsToRedeem > 0 && customerId) {
        await supabase
          .from("customers")
          .update({ points: customerPoints - pointsToRedeem })
          .eq("id", customerId);

        await supabase
          .from("loyalty_transactions")
          .insert({
            customer_id: customerId,
            order_id: order.id,
            points: -pointsToRedeem,
            transaction_type: "redeem",
            store_id: profile.store_id,
            description: `Resgate de ${pointsToRedeem} pontos no pedido ${orderNumber}`,
          });
      }

      // Register coupon use if applied
      if (appliedCouponData) {
        await registerCouponUse(
          appliedCouponData.couponId,
          order.id,
          appliedCouponData.discountAmount,
          clientNumber,
          customerId
        );
      }

      // Save new address if requested
      if (saveNewAddress && customerId && newAddress.address && newAddress.neighborhood) {
        await supabase
          .from("customer_addresses")
          .insert({
            customer_id: customerId,
            name: newAddress.name || "Endereço",
            address: newAddress.address,
            number: newAddress.number,
            neighborhood: newAddress.neighborhood,
            reference: newAddress.reference,
            cep: newAddress.cep,
          });
      }

      // Send WhatsApp message with order summary
      await sendWhatsAppOrderSummary(order, orderItems, deliveryAddress);

      // Print order
      setTimeout(() => {
      // Print order
      const orderToPrint = {
        ...order,
        payment_methods: Array.isArray(order.payment_methods) ? order.payment_methods as string[] : null,
        payment_amounts: Array.isArray(order.payment_amounts) ? order.payment_amounts as number[] : null,
        card_machine_names: Array.isArray(order.card_machine_ids) 
          ? (order.card_machine_ids as string[]).map(id => cardMachines.find(cm => cm.id === id)?.name).filter(Boolean) as string[]
          : null,
      };
      printOrder(orderToPrint, orderItems);
      }, 500);

      // Clear cart
      setCart([]);
      setPaymentMethod(null);
      setSelectedPaymentMethodId(null);
      setChangeFor("");
      setIsReserva(false);
      setIsMultiPaymentMode(false);
      setMultiPaymentSelections([]);
      setAppliedCouponData(null);
      setDiscount("");
      
      // Limpar carrinho do localStorage
      const cartKey = `whatsapp_cart_${profile.store_id}_${clientNumber}`;
      localStorage.removeItem(cartKey);

      toast.success("Pedido finalizado com sucesso!");
      onClose();
    } catch (error: any) {
      console.error("Erro ao finalizar pedido:", error);
      toast.error(`Erro ao finalizar pedido: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendWhatsAppOrderSummary = async (order: any, orderItems: any[], deliveryAddress: any) => {
    let message = `*PEDIDO CONFIRMADO* ✅\n\n`;
    message += `*Pedido:* #${order.order_number}\n`;
    message += `*Total:* R$ ${order.total.toFixed(2)}\n`;
    message += `*Pagamento:* ${order.payment_method}\n\n`;
    
    message += `*Itens:*\n`;
    orderItems.forEach(item => {
      message += `• ${item.quantity}x ${item.product_name}`;
      if (item.variation_name) {
        message += ` (${item.variation_name})`;
      }
      message += `\n`;
    });

    if (isDelivery && deliveryAddress) {
      message += `\n*🏠 Entrega*\n`;
      message += `${deliveryAddress.address}, ${deliveryAddress.number}\n`;
      message += `Bairro: ${deliveryAddress.neighborhood}\n`;
      if (deliveryAddress.reference) {
        message += `Ref: ${deliveryAddress.reference}\n`;
      }
      if (order.delivery_fee) {
        message += `Taxa de entrega: R$ ${order.delivery_fee.toFixed(2)}\n`;
      }
    }

    if (isReserva && reservaPickupTime) {
      message += `\n*⏰ Retirada agendada para:* ${reservaPickupTime}\n`;
    }

    if (notes) {
      message += `\n*📝 Observações:* ${notes}\n`;
    }

    message += `\n_Obrigado pela preferência!_`;

    // Send via edge function
    try {
      await supabase.functions.invoke("send-whatsapp", {
        body: {
          clientNumber,
          message,
        },
      });
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
    }
  };

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            PDV WhatsApp
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="add" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add">Adicionar Itens</TabsTrigger>
            <TabsTrigger value="checkout">
              Finalizar
              {cart.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {cart.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB: Adicionar Itens */}
          <TabsContent value="add" className="space-y-4">
            {/* Total no topo */}
            <div className="sticky top-0 bg-background p-4 border rounded-lg shadow-sm z-10">
              <div className="text-2xl font-bold text-primary">
                Total: R$ {finalTotal.toFixed(2)}
              </div>
              {pointsToRedeem > 0 && (
                <div className="text-sm text-purple-600 font-medium">
                  + {pointsToRedeem} pontos de fidelidade
                </div>
              )}
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro de categorias */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategoryId === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategoryId(null)}
              >
                Todas
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategoryId === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Produtos por categoria */}
            <div className="space-y-6">
              {Object.keys(productsByCategory).map(categoryName => (
                <div key={categoryName}>
                  <h3 className="text-lg font-bold mb-3">{categoryName}</h3>
                  <div className="space-y-2">
                    {productsByCategory[categoryName].map((product) => {
                      const productVariations = allVariations.filter(v => v.product_id === product.id);
                      const isOutOfStock = product.has_variations
                        ? productVariations.every(v => v.stock_quantity === 0 && !v.is_composite)
                        : product.stock_quantity === 0;
                      const isFavorite = favoriteProductIds.includes(product.id);

                      return (
                        <ProductCardWithVariations
                          key={product.id}
                          product={{
                            ...product,
                            earns_loyalty_points: false,
                            loyns_loyalty_points_value: 0,
                          }}
                          productVariations={productVariations}
                          isOutOfStock={isOutOfStock}
                          isFavorite={isFavorite}
                          toggleFavorite={toggleFavorite}
                          handleAddToCart={handleAddToCart}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB: Finalizar */}
          <TabsContent value="checkout" className="space-y-4">
            {/* Itens do carrinho */}
            <div className="space-y-2">
              <h3 className="font-semibold">Itens do Pedido</h3>
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Carrinho vazio
                </p>
              ) : (
                cart.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.selectedVariation && (
                        <p className="text-sm text-muted-foreground">
                          {item.selectedVariation.name}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-primary">
                        {item.isRedeemedWithPoints ? (
                          <span className="flex items-center gap-1">
                            <Gift className="h-3 w-3" />
                            {item.redemption_points_cost * item.quantity} pts
                          </span>
                        ) : (
                          `R$ ${((item.selectedVariation 
                            ? item.price + item.selectedVariation.price_adjustment 
                            : item.price) * item.quantity).toFixed(2)}`
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(index, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(index, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <>
                {/* Forma de Pagamento */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Forma de Pagamento</Label>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="multiPaymentWhatsapp" className="text-sm text-muted-foreground cursor-pointer">
                        Múltiplos?
                      </Label>
                      <Switch
                        id="multiPaymentWhatsapp"
                        checked={isMultiPaymentMode}
                        onCheckedChange={(checked) => {
                          setIsMultiPaymentMode(checked);
                          if (checked) {
                            setPaymentMethod(null);
                            setSelectedPaymentMethodId(null);
                            setMultiPaymentSelections([]);
                          }
                        }}
                      />
                    </div>
                  </div>
                  {!isMultiPaymentMode && (
                    <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "pix", label: "PIX", icon: QrCode },
                      { value: "credito", label: "Crédito", icon: CreditCard },
                      { value: "debito", label: "Débito", icon: CreditCard },
                      { value: "dinheiro", label: "Dinheiro", icon: Banknote },
                      { value: "reserva", label: "Reserva", icon: Clock },
                    ].map((method) => {
                      const Icon = method.icon;
                      return (
                        <Button
                          key={method.value}
                          type="button"
                          variant={paymentMethod === method.value ? "default" : "outline"}
                          onClick={() => {
                            setPaymentMethod(method.value as any);
                            setSelectedPaymentMethodId(null);
                          }}
                          disabled={isReserva && method.value !== "reserva"}
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {method.label}
                        </Button>
                      );
                    })}
                    
                    {paymentMethods
                      .filter(pm => pm.allowed_channels.includes('whatsapp'))
                      .map((method) => (
                        <Button
                          key={method.id}
                          type="button"
                          variant={selectedPaymentMethodId === method.id ? "default" : "outline"}
                          onClick={() => {
                            setPaymentMethod(null);
                            setSelectedPaymentMethodId(method.id);
                          }}
                          disabled={isReserva}
                          className="flex items-center gap-2"
                        >
                          <CreditCard className="h-4 w-4" />
                          {method.name}
                        </Button>
                        ))}
                      </div>
                    )}
                    {isMultiPaymentMode && multiPaymentSelections.length === 0 && (
                      <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
                        Clique em <span className="font-semibold">Finalizar Venda</span> para selecionar múltiplas formas de pagamento
                      </div>
                    )}
                    {isMultiPaymentMode && multiPaymentSelections.length > 0 && (
                      <div className="p-3 bg-muted rounded-lg space-y-2">
                        <p className="text-sm font-medium">Pagamentos:</p>
                        {multiPaymentSelections.map((payment, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{payment.methodName}</span>
                            <span>R$ {payment.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isMultiPaymentMode && paymentMethod === "dinheiro" && (
                  <div className="space-y-2">
                    <Label>Troco para quanto?</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                )}

                {/* Reserva */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="reserva"
                    checked={isReserva}
                    onCheckedChange={(checked) => {
                      setIsReserva(checked as boolean);
                      if (checked) {
                        setSelectedPaymentMethodId(null);
                      }
                    }}
                  />
                  <Label htmlFor="reserva" className="cursor-pointer">
                    É uma reserva (pagar na retirada)
                  </Label>
                </div>

                {isReserva && (
                  <div className="space-y-2">
                    <Label>Horário de Retirada</Label>
                    <Input
                      type="time"
                      value={reservaPickupTime}
                      onChange={(e) => setReservaPickupTime(e.target.value)}
                    />
                  </div>
                )}

                {/* Desconto */}
                <div className="space-y-2">
                  <Label>Desconto (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                {/* Cupom */}
                <CouponInput
                  storeId={profile?.store_id}
                  cart={cart.map(item => ({
                    id: item.id,
                    price: item.selectedVariation ? item.price + item.selectedVariation.price_adjustment : item.price,
                    quantity: item.quantity,
                    selectedVariation: item.selectedVariation,
                    isRedeemedWithPoints: item.isRedeemedWithPoints,
                  }))}
                  subtotal={totalMonetary}
                  customerPhone={clientNumber}
                  onCouponApplied={setAppliedCouponData}
                  disabled={isSubmitting}
                />

                {/* Entrega */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delivery"
                    checked={isDelivery}
                    onCheckedChange={(checked) => setIsDelivery(checked as boolean)}
                  />
                  <Label htmlFor="delivery" className="cursor-pointer">
                    É para entrega
                  </Label>
                </div>

                {isDelivery && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <div className="space-y-2">
                      <Label>Taxa de Entrega (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    {savedAddresses.length > 0 && (
                      <div className="space-y-2">
                        <Label>Endereços Salvos</Label>
                        <Select
                          value={selectedAddressId || ""}
                          onValueChange={setSelectedAddressId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um endereço salvo ou cadastre novo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">+ Novo Endereço</SelectItem>
                            {savedAddresses.map((addr) => (
                              <SelectItem key={addr.id} value={addr.id}>
                                {addr.name} - {addr.address}, {addr.number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {(!selectedAddressId || selectedAddressId === "new") && (
                      <div className="space-y-3">
                        <Input
                          placeholder="Nome do endereço (ex: Casa, Trabalho)"
                          value={newAddress.name}
                          onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Rua"
                            className="col-span-2"
                            value={newAddress.address}
                            onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                          />
                          <Input
                            placeholder="Nº"
                            value={newAddress.number}
                            onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                          />
                        </div>
                        <Input
                          placeholder="Bairro"
                          value={newAddress.neighborhood}
                          onChange={(e) => setNewAddress({ ...newAddress, neighborhood: e.target.value })}
                        />
                        <Input
                          placeholder="Referência"
                          value={newAddress.reference}
                          onChange={(e) => setNewAddress({ ...newAddress, reference: e.target.value })}
                        />
                        <Input
                          placeholder="CEP (opcional)"
                          value={newAddress.cep}
                          onChange={(e) => setNewAddress({ ...newAddress, cep: e.target.value })}
                        />
                        {customer && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="save-address"
                              checked={saveNewAddress}
                              onCheckedChange={(checked) => setSaveNewAddress(checked as boolean)}
                            />
                            <Label htmlFor="save-address" className="cursor-pointer text-sm">
                              Salvar este endereço para próximas vezes
                            </Label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Observações */}
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Observações do pedido..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Resumo final */}
                <div className="space-y-2 p-4 border-t">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {totalMonetary.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto:</span>
                      <span>- R$ {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {deliveryFeeAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Taxa de Entrega:</span>
                      <span>R$ {deliveryFeeAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {pointsToRedeem > 0 && (
                    <div className="flex justify-between text-purple-600">
                      <span>Pontos a Resgatar:</span>
                      <span>{pointsToRedeem} pts</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-primary">
                    <span>Total:</span>
                    <span>R$ {finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Botões */}
                <div className="space-y-2">
                  <Button
                    onClick={clearCart}
                    variant="outline"
                    className="w-full"
                    disabled={cart.length === 0}
                    size="lg"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Carrinho
                  </Button>
                  <Button
                    onClick={handleFinalizeSale}
                    disabled={isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? "Finalizando..." : "Finalizar Venda"}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>

      <MultiPaymentDialog
        open={showMultiPaymentDialog}
        onOpenChange={setShowMultiPaymentDialog}
        totalAmount={finalTotal}
        paymentMethods={[
          ...paymentMethods,
          { id: 'pix', name: 'PIX', is_active: true },
          { id: 'credito', name: 'Crédito', is_active: true },
          { id: 'debito', name: 'Débito', is_active: true },
          { id: 'dinheiro', name: 'Dinheiro', is_active: true },
        ]}
        cardMachines={cardMachines}
        onConfirm={(payments) => {
          setMultiPaymentSelections(payments);
          setShowMultiPaymentDialog(false);
          toast.success("Pagamentos confirmados! Clique em finalizar.");
        }}
      />
    </Sheet>
  );
};

export default CompactPDV;
