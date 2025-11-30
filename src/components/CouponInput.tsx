import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Ticket, X, Loader2, Check } from "lucide-react";
import { useCoupon } from "@/hooks/useCoupon";
import { toast } from "sonner";

interface CartItem {
  id: string;
  price: number;
  quantity: number;
  selectedVariation?: {
    id: string;
    price_adjustment: number;
  };
  isRedeemedWithPoints?: boolean;
}

interface CouponInputProps {
  storeId: string | null | undefined;
  cart: CartItem[];
  subtotal: number;
  customerPhone?: string;
  onCouponApplied: (result: {
    discountAmount: number;
    freeShipping: boolean;
    couponId: string;
    couponCode: string;
  } | null) => void;
  disabled?: boolean;
}

export default function CouponInput({
  storeId,
  cart,
  subtotal,
  customerPhone,
  onCouponApplied,
  disabled = false,
}: CouponInputProps) {
  const {
    couponCode,
    setCouponCode,
    appliedCoupon,
    isValidating,
    validateCoupon,
    applyCoupon,
    clearCoupon,
  } = useCoupon(storeId);

  const [showInput, setShowInput] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Digite o código do cupom");
      return;
    }

    const result = await validateCoupon(couponCode, cart, customerPhone);

    if (!result.valid) {
      toast.error(result.error || "Cupom inválido");
      return;
    }

    if (result.coupon) {
      const application = applyCoupon(result.coupon, cart, subtotal);
      onCouponApplied(application);
      toast.success("Cupom aplicado com sucesso!");
    }
  };

  const handleRemoveCoupon = () => {
    clearCoupon();
    onCouponApplied(null);
    setShowInput(false);
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">{appliedCoupon.couponCode}</span>
          {appliedCoupon.freeShipping ? (
            <Badge variant="secondary" className="text-xs">Frete Grátis</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              -R$ {appliedCoupon.discountAmount.toFixed(2)}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveCoupon}
          className="h-8 w-8 p-0"
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (!showInput) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowInput(true)}
        className="w-full gap-2"
        disabled={disabled || cart.length === 0}
      >
        <Ticket className="h-4 w-4" />
        Cupom?
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm">Código do Cupom</Label>
      <div className="flex gap-2">
        <Input
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="DESCONTO10"
          className="uppercase flex-1"
          disabled={isValidating || disabled}
          onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
        />
        <Button
          onClick={handleApplyCoupon}
          disabled={isValidating || !couponCode.trim() || disabled}
          size="sm"
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Aplicar"
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowInput(false);
            setCouponCode("");
          }}
          disabled={isValidating}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
