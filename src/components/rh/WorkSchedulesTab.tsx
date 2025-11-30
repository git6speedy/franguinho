import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Clock, Calendar } from "lucide-react";

interface WorkSchedule {
  id: string;
  employee_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  employee?: {
    full_name: string;
  };
}

interface Employee {
  id: string;
  full_name: string;
  termination_date: string | null;
}

const daysOfWeek = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

export default function WorkSchedulesTab() {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);
  const [formData, setFormData] = useState({
    employee_id: "",
    day_of_week: "",
    start_time: "",
    end_time: "",
  });
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.store_id) {
      loadSchedules();
      loadEmployees();
    }
  }, [profile?.store_id]);

  const loadSchedules = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("work_schedules")
      .select(`
        *,
        employee:employees(full_name)
      `)
      .eq("store_id", profile.store_id)
      .order("day_of_week")
      .order("start_time");

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as escalas.",
        variant: "destructive",
      });
      return;
    }

    setSchedules(data || []);
  };

  const loadEmployees = async () => {
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
  };

  const handleSave = async () => {
    if (
      !profile?.store_id ||
      !formData.employee_id ||
      !formData.day_of_week ||
      !formData.start_time ||
      !formData.end_time
    ) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    const dataToSave = {
      store_id: profile.store_id,
      employee_id: formData.employee_id,
      day_of_week: parseInt(formData.day_of_week),
      start_time: formData.start_time,
      end_time: formData.end_time,
    };

    if (editingSchedule) {
      const { error } = await supabase
        .from("work_schedules")
        .update(dataToSave)
        .eq("id", editingSchedule.id);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar a escala.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Escala atualizada com sucesso!",
      });
    } else {
      const { error } = await supabase
        .from("work_schedules")
        .insert(dataToSave);

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível criar a escala.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Escala criada com sucesso!",
      });
    }

    setIsDialogOpen(false);
    setEditingSchedule(null);
    resetForm();
    loadSchedules();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta escala?")) {
      return;
    }

    const { error } = await supabase
      .from("work_schedules")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a escala.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Escala excluída!",
    });
    loadSchedules();
  };

  const openEditDialog = (schedule: WorkSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      employee_id: schedule.employee_id,
      day_of_week: schedule.day_of_week.toString(),
      start_time: schedule.start_time,
      end_time: schedule.end_time,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingSchedule(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      day_of_week: "",
      start_time: "",
      end_time: "",
    });
  };

  const getDayLabel = (day: number) => {
    return daysOfWeek.find((d) => d.value === day)?.label || "";
  };

  // Group schedules by employee
  const schedulesByEmployee = schedules.reduce((acc, schedule) => {
    const employeeName = schedule.employee?.full_name || "Sem nome";
    if (!acc[employeeName]) {
      acc[employeeName] = [];
    }
    acc[employeeName].push(schedule);
    return acc;
  }, {} as Record<string, WorkSchedule[]>);

  return (
    <Card data-work-schedules-tab>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Escalas de Trabalho
        </CardTitle>
        <CardDescription>
          Gerencie os horários de trabalho da equipe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={openNewDialog} data-new-schedule-btn>
          <Plus className="h-4 w-4 mr-2" />
          Nova Escala
        </Button>

        <div className="space-y-4">
          {Object.entries(schedulesByEmployee).map(([employeeName, empSchedules]) => (
            <div key={employeeName} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">{employeeName}</h3>
              <div className="space-y-2">
                {empSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-3 bg-accent rounded-lg"
                    data-schedule-item
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        {getDayLabel(schedule.day_of_week)}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>
                          {schedule.start_time} - {schedule.end_time}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(schedule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {schedules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma escala cadastrada ainda
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? "Editar" : "Nova"} Escala
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
                <Label htmlFor="day_of_week">Dia da Semana *</Label>
                <Select
                  value={formData.day_of_week}
                  onValueChange={(value) =>
                    setFormData({ ...formData, day_of_week: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Horário de Entrada *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="end_time">Horário de Saída *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
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
