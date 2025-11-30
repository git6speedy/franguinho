import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Briefcase } from "lucide-react";

interface JobRole {
  id: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
}

export default function JobRolesTab() {
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<JobRole | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.store_id) {
      loadRoles();
    }
  }, [profile?.store_id]);

  const loadRoles = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("job_roles")
      .select("*")
      .eq("store_id", profile.store_id)
      .order("name");

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as funções.",
        variant: "destructive",
      });
      return;
    }

    setRoles(data || []);
  };

  const handleSave = async () => {
    if (!profile?.store_id || !formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o nome da função.",
        variant: "destructive",
      });
      return;
    }

    const dataToSave = {
      store_id: profile.store_id,
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      is_system_role: false,
    };

    if (editingRole) {
      const { error } = await supabase
        .from("job_roles")
        .update(dataToSave)
        .eq("id", editingRole.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a função.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Função atualizada com sucesso!",
      });
    } else {
      const { error } = await supabase
        .from("job_roles")
        .insert(dataToSave);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível criar a função.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Função criada com sucesso!",
      });
    }

    setIsDialogOpen(false);
    setEditingRole(null);
    setFormData({ name: "", description: "" });
    loadRoles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta função?")) {
      return;
    }

    const { error } = await supabase
      .from("job_roles")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a função.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Função excluída!",
    });
    loadRoles();
  };

  const openEditDialog = (role: JobRole) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingRole(null);
    setFormData({ name: "", description: "" });
    setIsDialogOpen(true);
  };

  return (
    <Card data-job-roles-tab>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Funções
        </CardTitle>
        <CardDescription>
          Gerencie os cargos e funções da sua equipe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={openNewDialog} data-new-job-role-btn>
          <Plus className="h-4 w-4 mr-2" />
          Nova Função
        </Button>

        <div className="space-y-2">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between p-4 border rounded-lg"
              data-job-role-item
            >
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  {role.name}
                  {role.is_system_role && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      Sistema
                    </span>
                  )}
                </div>
                {role.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {role.description}
                  </div>
                )}
              </div>
              {!role.is_system_role && (
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEditDialog(role)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(role.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {roles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma função cadastrada ainda
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRole ? "Editar" : "Nova"} Função
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Função *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Caixa, Gerente, Vendedor"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descreva as responsabilidades..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
