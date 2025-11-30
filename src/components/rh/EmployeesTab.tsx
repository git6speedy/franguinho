import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, UserCheck, UserX } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  cpf: string | null;
  rg: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  salary: number | null;
  hire_date: string | null;
  termination_date: string | null;
  notes: string | null;
  job_role_id: string | null;
  job_role?: {
    name: string;
  };
}

interface JobRole {
  id: string;
  name: string;
}

export default function EmployeesTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    cpf: "",
    rg: "",
    phone: "",
    email: "",
    address: "",
    salary: "",
    hire_date: "",
    termination_date: "",
    job_role_id: "",
    notes: "",
  });
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.store_id) {
      loadEmployees();
      loadJobRoles();
    }
  }, [profile?.store_id]);

  const loadEmployees = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("employees")
      .select(`
        *,
        job_role:job_roles(name)
      `)
      .eq("store_id", profile.store_id)
      .order("full_name");

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os funcionários.",
        variant: "destructive",
      });
      return;
    }

    setEmployees(data || []);
  };

  const loadJobRoles = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("job_roles")
      .select("id, name")
      .eq("store_id", profile.store_id)
      .order("name");

    if (error) {
      console.error("Erro ao carregar funções:", error);
      return;
    }

    setJobRoles(data || []);
  };

  const handleSave = async () => {
    if (!profile?.store_id || !formData.full_name.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o nome do funcionário.",
        variant: "destructive",
      });
      return;
    }

    const dataToSave = {
      store_id: profile.store_id,
      full_name: formData.full_name.trim(),
      cpf: formData.cpf.trim() || null,
      rg: formData.rg.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      address: formData.address.trim() || null,
      salary: formData.salary ? parseFloat(formData.salary) : null,
      hire_date: formData.hire_date || null,
      termination_date: formData.termination_date || null,
      job_role_id: formData.job_role_id || null,
      notes: formData.notes.trim() || null,
    };

    if (editingEmployee) {
      const { error } = await supabase
        .from("employees")
        .update(dataToSave)
        .eq("id", editingEmployee.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o funcionário.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Funcionário atualizado com sucesso!",
      });
    } else {
      const { error } = await supabase
        .from("employees")
        .insert(dataToSave);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível criar o funcionário.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Funcionário criado com sucesso!",
      });
    }

    setIsDialogOpen(false);
    setEditingEmployee(null);
    resetForm();
    loadEmployees();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este funcionário?")) {
      return;
    }

    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o funcionário.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Funcionário excluído!",
    });
    loadEmployees();
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      full_name: employee.full_name,
      cpf: employee.cpf || "",
      rg: employee.rg || "",
      phone: employee.phone || "",
      email: employee.email || "",
      address: employee.address || "",
      salary: employee.salary ? employee.salary.toString() : "",
      hire_date: employee.hire_date || "",
      termination_date: employee.termination_date || "",
      job_role_id: employee.job_role_id || "",
      notes: employee.notes || "",
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingEmployee(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      cpf: "",
      rg: "",
      phone: "",
      email: "",
      address: "",
      salary: "",
      hire_date: "",
      termination_date: "",
      job_role_id: "",
      notes: "",
    });
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <Card data-employees-tab>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Funcionários
        </CardTitle>
        <CardDescription>
          Gerencie a equipe da sua loja
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={openNewDialog} data-new-employee-btn>
          <Plus className="h-4 w-4 mr-2" />
          Novo Funcionário
        </Button>

        <div className="space-y-3">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              data-employee-item
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{employee.full_name}</span>
                  {!employee.termination_date ? (
                    <Badge variant="default" className="bg-green-500">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <UserX className="h-3 w-3 mr-1" />
                      Inativo
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1 space-y-1">
                  {employee.job_role?.name && (
                    <div>Função: {employee.job_role.name}</div>
                  )}
                  {employee.phone && <div>Tel: {employee.phone}</div>}
                  {employee.hire_date && (
                    <div>Admissão: {formatDate(employee.hire_date)}</div>
                  )}
                  {employee.salary && <div>Salário: {formatCurrency(employee.salary)}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => openEditDialog(employee)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(employee.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {employees.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum funcionário cadastrado ainda
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Editar" : "Novo"} Funcionário
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    placeholder="Nome completo do funcionário"
                  />
                </div>

                <div>
                  <Label htmlFor="job_role_id">Função</Label>
                  <Select
                    value={formData.job_role_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, job_role_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="salary">Salário (R$)</Label>
                  <Input
                    id="salary"
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({ ...formData, salary: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    value={formData.rg}
                    onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                    placeholder="00.000.000-0"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Rua, número, bairro, cidade"
                  />
                </div>

                <div>
                  <Label htmlFor="hire_date">Data de Contratação</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) =>
                      setFormData({ ...formData, hire_date: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="termination_date">Data de Demissão</Label>
                  <Input
                    id="termination_date"
                    type="date"
                    value={formData.termination_date}
                    onChange={(e) =>
                      setFormData({ ...formData, termination_date: e.target.value })
                    }
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Informações adicionais..."
                    rows={3}
                  />
                </div>
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
