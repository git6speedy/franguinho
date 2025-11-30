import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PaymentMethod {
  id: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  allowed_channels: string[];
  card_machine_id: string | null;
  card_machine?: {
    name: string;
    debit_fee: number;
    credit_fee: number;
    installment_fees: any;
  };
}

interface CardMachine {
  id: string;
  name: string;
  is_active: boolean;
  debit_fee: number;
  credit_fee: number;
  installment_fees: any;
}

export function usePaymentMethods() {
  const { profile } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [cardMachines, setCardMachines] = useState<CardMachine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.store_id) {
      loadPaymentMethods();
      loadCardMachines();
    }
  }, [profile?.store_id]);

  const loadPaymentMethods = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("payment_methods")
      .select(`
        *,
        card_machine:card_machines(name, debit_fee, credit_fee, installment_fees)
      `)
      .eq("store_id", profile.store_id)
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setPaymentMethods(data);
    }
    setLoading(false);
  };

  const loadCardMachines = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("card_machines")
      .select("*")
      .eq("store_id", profile.store_id)
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setCardMachines(data);
    }
  };

  const getPaymentMethodsForChannel = (channel: string) => {
    return paymentMethods.filter(pm => 
      pm.allowed_channels.includes(channel)
    );
  };

  return {
    paymentMethods,
    cardMachines,
    loading,
    getPaymentMethodsForChannel,
  };
}
