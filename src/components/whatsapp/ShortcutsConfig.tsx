import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Settings, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ShortcutsConfigProps {
  onClose: () => void;
}

interface Shortcut {
  id?: string;
  command: string;
  message: string;
}

const ShortcutsConfig = ({ onClose }: ShortcutsConfigProps) => {
  const { profile } = useAuth();
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);

  useEffect(() => {
    if (!profile?.store_id) return;

    const fetchShortcuts = async () => {
      const { data } = await supabase
        .from("whatsapp_shortcuts")
        .select("*")
        .eq("store_id", profile.store_id)
        .order("command");

      setShortcuts(data || []);
    };

    fetchShortcuts();
  }, [profile?.store_id]);

  const addShortcut = () => {
    setShortcuts([...shortcuts, { command: "", message: "" }]);
  };

  const updateShortcut = (index: number, field: "command" | "message", value: string) => {
    const updated = [...shortcuts];
    updated[index][field] = value;
    setShortcuts(updated);
  };

  const saveShortcut = async (index: number) => {
    if (!profile?.store_id) return;

    const shortcut = shortcuts[index];
    
    if (!shortcut.command || !shortcut.message) {
      toast.error("Preencha comando e mensagem");
      return;
    }

    if (shortcut.id) {
      // Update
      await supabase
        .from("whatsapp_shortcuts")
        .update({
          command: shortcut.command,
          message: shortcut.message,
        })
        .eq("id", shortcut.id);
    } else {
      // Insert
      const { data } = await supabase
        .from("whatsapp_shortcuts")
        .insert({
          store_id: profile.store_id,
          command: shortcut.command,
          message: shortcut.message,
        })
        .select()
        .single();

      if (data) {
        const updated = [...shortcuts];
        updated[index].id = data.id;
        setShortcuts(updated);
      }
    }

    toast.success("Atalho salvo");
  };

  const deleteShortcut = async (index: number) => {
    const shortcut = shortcuts[index];
    
    if (shortcut.id) {
      await supabase
        .from("whatsapp_shortcuts")
        .delete()
        .eq("id", shortcut.id);
    }

    setShortcuts(shortcuts.filter((_, i) => i !== index));
    toast.success("Atalho removido");
  };

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurar Atalhos
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Button onClick={addShortcut} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Novo Atalho
          </Button>

          <div className="space-y-4">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <Input
                  placeholder="Comando (ex: /pix)"
                  value={shortcut.command}
                  onChange={(e) => updateShortcut(index, "command", e.target.value)}
                />
                <Textarea
                  placeholder="Mensagem"
                  value={shortcut.message}
                  onChange={(e) => updateShortcut(index, "message", e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => saveShortcut(index)}
                    className="flex-1"
                  >
                    Salvar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteShortcut(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ShortcutsConfig;
