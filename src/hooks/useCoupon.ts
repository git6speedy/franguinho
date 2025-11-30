import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Coupon {
  id: string;
  code: string;
  type: string; // "total" | "product" | "frete_gratis"
  discount_type: string | null; // "percent" | "fixed"
  discount_value: number | null;
  applicable_products: string[] | null;
  expires_at: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
}

interface CartItem {
  id: string; // product_id
  price: number;
  quantity: number;
  selectedVariation?: {
    id: string;
    price_adjustment: number;
  };
  isRedeemedWithPoints?: boolean;
}

interface CouponValidationResult {
  valid: boolean;
  error?: string;
  coupon?: Coupon;
}

interface CouponApplicationResult {
  discountAmount: number;
  freeShipping: boolean;
  couponId: string;
  couponCode: string;
}

export function useCoupon(storeId: string | null | undefined) {
  const [appliedCoupon, setAppliedCoupon] = useState<CouponApplicationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  const validateCoupon = useCallback(async (
    code: string,
    cart: CartItem[],
    customerPhone?: string
  ): Promise<CouponValidationResult> => {
    if (!storeId || !code.trim()) {
      return { valid: false, error: "Código do cupom inválido" };
    }

    setIsValidating(true);

    try {
      // Fetch the coupon
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("store_id", storeId)
        .eq("code", code.toUpperCase().trim())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        return { valid: false, error: "Cupom não encontrado" };
      }

      // Check if expired
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { valid: false, error: "Cupom expirado" };
      }

      // Check max uses
      if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
        return { valid: false, error: "Cupom esgotado" };
      }

      // Check if customer already used this coupon (if phone provided)
      if (customerPhone) {
        const { data: existingUse, error: useError } = await supabase
          .from("coupon_uses")
          .select("id")
          .eq("coupon_id", coupon.id)
          .eq("customer_phone", customerPhone)
          .maybeSingle();

        if (useError && useError.code !== "PGRST116") throw useError;

        if (existingUse) {
          return { valid: false, error: "Você já utilizou este cupom" };
        }
      }

      // For product-specific coupons, check if cart has applicable products
      if (coupon.type === "product") {
        const applicableProducts = coupon.applicable_products || [];
        const cartProductIds = cart.map(item => item.id);
        const hasApplicableProduct = applicableProducts.some(
          productId => cartProductIds.includes(productId)
        );

        if (!hasApplicableProduct) {
          return { valid: false, error: "Nenhum produto do carrinho é válido para este cupom" };
        }
      }

      return { valid: true, coupon: coupon as Coupon };
    } catch (error) {
      console.error("Error validating coupon:", error);
      return { valid: false, error: "Erro ao validar cupom" };
    } finally {
      setIsValidating(false);
    }
  }, [storeId]);

  const applyCoupon = useCallback((
    coupon: Coupon,
    cart: CartItem[],
    subtotal: number
  ): CouponApplicationResult => {
    let discountAmount = 0;
    let freeShipping = false;

    switch (coupon.type) {
      case "frete_gratis":
        freeShipping = true;
        break;

      case "total":
        if (coupon.discount_type === "percent" && coupon.discount_value) {
          discountAmount = (subtotal * coupon.discount_value) / 100;
        } else if (coupon.discount_type === "fixed" && coupon.discount_value) {
          discountAmount = Math.min(coupon.discount_value, subtotal);
        }
        break;

      case "product":
        const applicableProducts = coupon.applicable_products || [];
        const applicableItems = cart.filter(
          item => applicableProducts.includes(item.id) && !item.isRedeemedWithPoints
        );

        const applicableSubtotal = applicableItems.reduce((sum, item) => {
          const itemPrice = item.selectedVariation
            ? item.price + item.selectedVariation.price_adjustment
            : item.price;
          return sum + (itemPrice * item.quantity);
        }, 0);

        if (coupon.discount_type === "percent" && coupon.discount_value) {
          discountAmount = (applicableSubtotal * coupon.discount_value) / 100;
        } else if (coupon.discount_type === "fixed" && coupon.discount_value) {
          discountAmount = Math.min(coupon.discount_value, applicableSubtotal);
        }
        break;
    }

    const result: CouponApplicationResult = {
      discountAmount: Math.round(discountAmount * 100) / 100,
      freeShipping,
      couponId: coupon.id,
      couponCode: coupon.code,
    };

    setAppliedCoupon(result);
    return result;
  }, []);

  const registerCouponUse = useCallback(async (
    couponId: string,
    orderId: string | null,
    discountApplied: number,
    customerPhone?: string,
    customerId?: string
  ): Promise<boolean> => {
    try {
      // Insert coupon use record
      const { error: useError } = await supabase
        .from("coupon_uses")
        .insert({
          coupon_id: couponId,
          order_id: orderId,
          discount_applied: discountApplied,
          customer_phone: customerPhone || null,
          customer_id: customerId || null,
        });

      if (useError) throw useError;

      // Increment current_uses
      const { data: currentCoupon } = await supabase
        .from("coupons")
        .select("current_uses")
        .eq("id", couponId)
        .single();

      if (currentCoupon) {
        await supabase
          .from("coupons")
          .update({ current_uses: (currentCoupon.current_uses || 0) + 1 })
          .eq("id", couponId);
      }

      return true;
    } catch (error) {
      console.error("Error registering coupon use:", error);
      return false;
    }
  }, []);

  const clearCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode("");
  }, []);

  return {
    couponCode,
    setCouponCode,
    appliedCoupon,
    isValidating,
    validateCoupon,
    applyCoupon,
    registerCouponUse,
    clearCoupon,
  };
}
