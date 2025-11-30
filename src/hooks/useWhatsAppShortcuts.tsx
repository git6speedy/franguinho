import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Shortcut {
  id: string;
  command: string;
  message: string;
  type: string;
  menu_items?: any;
  show_buttons?: boolean;
  created_at: string;
  updated_at: string;
  store_id: string;
}

export const useWhatsAppShortcuts = () => {
  const { profile } = useAuth();
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.store_id) return;

    const fetchShortcuts = async () => {
      const { data, error } = await supabase
        .from("whatsapp_shortcuts")
        .select("*")
        .eq("store_id", profile.store_id)
        .order("command");

      if (error) {
        console.error("Error fetching shortcuts:", error);
        return;
      }

      setShortcuts(data || []);
      setLoading(false);
    };

    fetchShortcuts();
  }, [profile?.store_id]);

  return { shortcuts, loading };
};
