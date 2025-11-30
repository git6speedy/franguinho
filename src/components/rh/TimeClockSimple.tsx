import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogIn, LogOut, Download, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import RealTimeClock from "@/components/RealTimeClock";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface TimeClockRecord {
  id: string;
  employee_id: string;
  clock_in: string;
  clock_out: string | null;
  break_duration: number | null;
  notes: string | null;
  employees?: {
    full_name: string;
  };
}

interface Employee {
  id: string;
  full_name: string;
}

export default function TimeClockSimple() {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [records, setRecords] = useState<TimeClockRecord[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("");

  useEffect(() => {
    if (profile?.store_id) {
      loadEmployees();
      loadRecords();
    }
  }, [profile?.store_id, dateRange, filterEmployeeId]);

  const loadEmployees = async () => {
    if (!profile?.store_id) return;

    const { data, error } = await supabase
      .from("employees")
      .select("id, full_name")
      .eq("store_id", profile.store_id)
      .is("termination_date", null)
      .order("full_name");

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar funcionários",
        description: error.message,
      });
    } else {
      setEmployees(data || []);
    }
  };

  const loadRecords = async () => {
    if (!profile?.store_id) return;

    let query = supabase
      .from("time_clock_records")
      .select(`
        *,
        employees!inner(full_name)
      `)
      .eq("store_id", profile.store_id)
      .order("clock_in", { ascending: false });

    if (filterEmployeeId && filterEmployeeId !== "all") {
      query = query.eq("employee_id", filterEmployeeId);
    }

    if (dateRange?.from) {
      query = query.gte("clock_in", format(dateRange.from, "yyyy-MM-dd"));
    }

    if (dateRange?.to) {
      query = query.lte("clock_in", format(dateRange.to, "yyyy-MM-dd"));
    }

    const { data, error } = await query;

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar registros",
        description: error.message,
      });
    } else {
      setRecords(data || []);
    }
  };

  const handleClockIn = async () => {
    if (!selectedEmployeeId) {
      toast({
        variant: "destructive",
        title: "Selecione um funcionário",
      });
      return;
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("time_clock_records")
      .insert({
        store_id: profile.store_id,
        employee_id: selectedEmployeeId,
        clock_in: now,
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar entrada",
        description: error.message,
      });
    } else {
      toast({
        title: "Entrada registrada!",
      });
      loadRecords();
    }
  };

  const handleClockOut = async () => {
    if (!selectedEmployeeId) {
      toast({
        variant: "destructive",
        title: "Selecione um funcionário",
      });
      return;
    }

    // Find last clock in without clock out for this employee
    const { data: lastRecord } = await supabase
      .from("time_clock_records")
      .select("id")
      .eq("store_id", profile.store_id)
      .eq("employee_id", selectedEmployeeId)
      .is("clock_out", null)
      .order("clock_in", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastRecord) {
      toast({
        variant: "destructive",
        title: "Nenhuma entrada sem saída encontrada",
      });
      return;
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("time_clock_records")
      .update({ clock_out: now })
      .eq("id", lastRecord.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar saída",
        description: error.message,
      });
    } else {
      toast({
        title: "Saída registrada!",
      });
      loadRecords();
    }
  };

  const exportToCSV = () => {
    const csvRows = [];
    csvRows.push("Funcionário,Entrada,Saída,Duração,Intervalo,Observações");

    records.forEach((record) => {
      const clockIn = format(parseISO(record.clock_in), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
      const clockOut = record.clock_out ? format(parseISO(record.clock_out), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : "-";
      const duration = record.clock_out ? calculateWorkHours(record.clock_in, record.clock_out, record.break_duration || 0) : "-";
      const breakDuration = record.break_duration ? `${record.break_duration} min` : "-";
      const notes = record.notes || "-";

      csvRows.push(`"${record.employees?.full_name}","${clockIn}","${clockOut}","${duration}","${breakDuration}","${notes}"`);
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ponto_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateWorkHours = (clockIn: string, clockOut: string, breakDuration: number) => {
    const start = new Date(clockIn).getTime();
    const end = new Date(clockOut).getTime();
    const totalMinutes = Math.floor((end - start) / 60000) - breakDuration;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}min`;
  };

  return (
    <div className="space-y-6">
      {/* Clock Interface */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-center">Registro de Ponto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <RealTimeClock />
          </div>

          <div className="space-y-2">
            <Label>Funcionário</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o funcionário" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleClockIn}
              className="w-full"
              size="lg"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Entrada
            </Button>
            <Button
              onClick={handleClockOut}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Saída
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Registros de Ponto</CardTitle>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Filtrar por data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <Label>Filtrar por funcionário</Label>
            <Select value={filterEmployeeId} onValueChange={setFilterEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os funcionários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {records.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum registro encontrado
              </p>
            ) : (
              records.map((record) => (
                <div key={record.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{record.employees?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Entrada: {format(parseISO(record.clock_in), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </p>
                      {record.clock_out && (
                        <p className="text-sm text-muted-foreground">
                          Saída: {format(parseISO(record.clock_out), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    {record.clock_out && (
                      <div className="text-right">
                        <p className="font-semibold">
                          {calculateWorkHours(record.clock_in, record.clock_out, record.break_duration || 0)}
                        </p>
                        {record.break_duration && (
                          <p className="text-xs text-muted-foreground">
                            Intervalo: {record.break_duration} min
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {record.notes && (
                    <p className="text-sm text-muted-foreground">
                      Obs: {record.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
