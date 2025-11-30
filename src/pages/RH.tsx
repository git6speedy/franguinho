import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Briefcase, Clock, FileText } from "lucide-react";
import EmployeesTab from "@/components/rh/EmployeesTab";
import JobRolesTab from "@/components/rh/JobRolesTab";
import WorkSchedulesTab from "@/components/rh/WorkSchedulesTab";
import TimeClockSimple from "@/components/rh/TimeClockSimple";

export default function RH() {
  return (
    <div className="space-y-6" data-rh-page>
      <div>
        <h1 className="text-3xl font-bold text-foreground">Recursos Humanos</h1>
        <p className="text-muted-foreground">
          Gerencie funcionários, escalas e ponto
        </p>
      </div>

      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Funcionários
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Funções
          </TabsTrigger>
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Escalas
          </TabsTrigger>
          <TabsTrigger value="timeclock" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Ponto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <EmployeesTab />
        </TabsContent>

        <TabsContent value="roles">
          <JobRolesTab />
        </TabsContent>

        <TabsContent value="schedules">
          <WorkSchedulesTab />
        </TabsContent>

        <TabsContent value="timeclock">
          <TimeClockSimple />
        </TabsContent>
      </Tabs>
    </div>
  );
}
