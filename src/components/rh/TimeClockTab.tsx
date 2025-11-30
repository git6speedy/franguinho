import { useState, useEffect, useCallback } from "react";
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
import { Plus, Edit, Clock, FileText, Download } from "lucide-react";

interface TimeClockRecord {
  id: string;
  employee_id: string;
  clock_in: string;
  clock_out: string | null;
  break_duration: number;
  notes: string | null;
  employee?: {
    full_name: string;
  };
}

interface Employee {
  id: string;
  full_name: string;
  termination_date: string | null;
}

export default function TimeClockTab() {
  const [records, setRecords] = useState<TimeClockRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TimeClockRecord | null>(null);
  const [filterEmployee, setFilterEmployee] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [formData, setFormData] = useState({
    employee_id: "",
    clock_in: "",
    clock_out: "",
    break_duration: "0",
    notes: "",
  });
  const { profile } = useAuth();
  const { toast } = useToast();

  const loadRecords = useCallback(async () => {
    if (!profile?.store_id) return;

    let query = supabase
      .from("time_clock_records")
      .select(`
        *,
        employee:employees(full_name)
      `)
      .eq("store_id", profile.store_id);

    if (filterEmployee) {
      query = query.eq("employee_id", filterEmployee);
    }

    if (filterStartDate) {
      query = query.gte("clock_in", filterStartDate);
    }

    if (filterEndDate) {
      query = query.lte("clock_in", filterEndDate + "T23:59:59");
    }

    query = query.order("clock_in", { ascending: false }).limit(50);

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os registros de ponto.",
        variant: "destructive",
      });
      return;
    }

    setRecords(data || []);
  }, [profile?.store_id, filterEmployee, filterStartDate, filterEndDate, toast]);

  const loadEmployees = useCallback(async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("employees")
      .select("id, full_name, termination_date")
      .eq("store_id", profile.store_id)
      .is("termination_date", null)
      .order("full_name");

    if (error) {
      console.error("Erro ao carregar funcionários:", error);
      return;
    }

    setEmployees(data || []);
  }, [profile?.store_id]);

  useEffect(() => {
    if (profile?.store_id) {
      loadRecords();
      loadEmployees();
    }
  }, [profile?.store_id, filterEmployee, filterStartDate, filterEndDate, loadRecords, loadEmployees]);

  const handleSave = async () => {
    if (!profile?.store_id || !formData.employee_id || !formData.clock_in) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const dataToSave = {
      store_id: profile.store_id,
      employee_id: formData.employee_id,
      clock_in: formData.clock_in,
      clock_out: formData.clock_out || null,
      break_duration: parseInt(formData.break_duration) || 0,
      notes: formData.notes.trim() || null,
    };

    if (editingRecord) {
      const { error } = await supabase
        .from("time_clock_records")
        .update(dataToSave)
        .eq("id", editingRecord.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o registro.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Registro atualizado com sucesso!",
      });
    } else {
      const { error } = await supabase
        .from("time_clock_records")
        .insert(dataToSave);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível criar o registro.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Registro criado com sucesso!",
      });
    }

    setIsDialogOpen(false);
    setEditingRecord(null);
    resetForm();
    loadRecords();
  };

  const openEditDialog = (record: TimeClockRecord) => {
    setEditingRecord(record);
    setFormData({
      employee_id: record.employee_id,
      clock_in: record.clock_in,
      clock_out: record.clock_out || "",
      break_duration: record.break_duration.toString(),
      notes: record.notes || "",
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingRecord(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      clock_in: "",
      clock_out: "",
      break_duration: "0",
      notes: "",
    });
  };

  const formatDateTime = (datetime: string) => {
    return new Date(datetime).toLocaleString("pt-BR");
  };

  const calculateWorkHours = (clockIn: string, clockOut: string | null, breakDuration: number) => {
    if (!clockOut) return "Em andamento";

    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / 60000) - breakDuration;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    return `${hours}h ${minutes}m`;
  };

  const exportToCSV = () => {
    if (records.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há registros para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Funcionário", "Entrada", "Saída", "Intervalo (min)", "Horas Trabalhadas", "Observações"];
    const rows = records.map((record) => [
      record.employee?.full_name || "",
      formatDateTime(record.clock_in),
      record.clock_out ? formatDateTime(record.clock_out) : "Em andamento",
      record.break_duration.toString(),
      calculateWorkHours(record.clock_in, record.clock_out, record.break_duration),
      record.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_ponto_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso!",
    });
  };

  return (
    <Card data-time-clock-tab>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Registros de Ponto
        </CardTitle>
        <CardDescription>
          Gerencie os registros de entrada e saída da equipe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-accent rounded-lg">
          <div>
            <Label htmlFor="filter_employee">Funcionário</Label>
            <Select value={filterEmployee || "all"} onValueChange={(value) => setFilterEmployee(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter_start_date">Data Inicial</Label>
            <Input
              id="filter_start_date"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="filter_end_date">Data Final</Label>
            <Input
              id="filter_end_date"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={openNewDialog} data-new-time-clock-btn>
            <Plus className="h-4 w-4 mr-2" />
            Novo Registro
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>

        <div className="space-y-2">
          {records.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-4 border rounded-lg"
              data-time-clock-item
            >
              <div className="flex-1">
                <div className="font-medium">{record.employee?.full_name}</div>
                <div className="text-sm text-muted-foreground space-y-1 mt-1">
                  <div>Entrada: {formatDateTime(record.clock_in)}</div>
                  <div>
                    Saída: {record.clock_out ? formatDateTime(record.clock_out) : "—"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {calculateWorkHours(record.clock_in, record.clock_out, record.break_duration)}
                    {record.break_duration > 0 && ` (${record.break_duration}min intervalo)`}
                  </div>
                  {record.notes && (
                    <div className="text-xs italic">{record.notes}</div>
                  )}
                </div>
              </div>
              <div>
                {!record.clock_out && (
                  <Badge variant="default" className="bg-green-500 mr-2">
                    Em andamento
                  </Badge>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => openEditDialog(record)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {records.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum registro encontrado
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? "Editar" : "Novo"} Registro de Ponto
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="employee_id">Funcionário *</Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, employee_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="clock_in">Entrada *</Label>
                <Input
                  id="clock_in"
                  type="datetime-local"
                  value={formData.clock_in}
                  onChange={(e) =>
                    setFormData({ ...formData, clock_in: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="clock_out">Saída</Label>
                <Input
                  id="clock_out"
                  type="datetime-local"
                  value={formData.clock_out}
                  onChange={(e) =>
                    setFormData({ ...formData, clock_out: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="break_duration">Intervalo (minutos)</Label>
                <Input
                  id="break_duration"
                  type="number"
                  min="0"
                  value={formData.break_duration}
                  onChange={(e) =>
                    setFormData({ ...formData, break_duration: e.target.value })
                  }
                />
              </div>

              <div>
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
