-- Criar tabelas do módulo RH
CREATE TABLE IF NOT EXISTS public.job_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  job_role_id UUID REFERENCES public.job_roles(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14),
  rg VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  salary NUMERIC(10,2),
  hire_date DATE,
  termination_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.work_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.time_clock_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  break_duration INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabelas de pagamento
CREATE TABLE IF NOT EXISTS public.card_machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  debit_fee NUMERIC(5,2) DEFAULT 0,
  credit_fee NUMERIC(5,2) DEFAULT 0,
  installment_fees JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  card_machine_id UUID REFERENCES public.card_machines(id) ON DELETE SET NULL,
  allowed_channels VARCHAR(50)[] DEFAULT ARRAY['presencial', 'ifood', 'whatsapp'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_clock_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para job_roles
CREATE POLICY "Users can view job roles from their store" ON public.job_roles
  FOR SELECT USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert job roles in their store" ON public.job_roles
  FOR INSERT WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update job roles in their store" ON public.job_roles
  FOR UPDATE USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete job roles in their store" ON public.job_roles
  FOR DELETE USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- Políticas RLS para employees
CREATE POLICY "Users can view employees from their store" ON public.employees
  FOR SELECT USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert employees in their store" ON public.employees
  FOR INSERT WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update employees in their store" ON public.employees
  FOR UPDATE USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete employees in their store" ON public.employees
  FOR DELETE USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- Políticas RLS para work_schedules
CREATE POLICY "Users can view schedules from their store" ON public.work_schedules
  FOR SELECT USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert schedules in their store" ON public.work_schedules
  FOR INSERT WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update schedules in their store" ON public.work_schedules
  FOR UPDATE USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete schedules in their store" ON public.work_schedules
  FOR DELETE USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- Políticas RLS para time_clock_records
CREATE POLICY "Users can view time records from their store" ON public.time_clock_records
  FOR SELECT USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert time records in their store" ON public.time_clock_records
  FOR INSERT WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update time records in their store" ON public.time_clock_records
  FOR UPDATE USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete time records in their store" ON public.time_clock_records
  FOR DELETE USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- Políticas RLS para card_machines
CREATE POLICY "Users can view card machines from their store" ON public.card_machines
  FOR SELECT USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert card machines in their store" ON public.card_machines
  FOR INSERT WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update card machines in their store" ON public.card_machines
  FOR UPDATE USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete card machines in their store" ON public.card_machines
  FOR DELETE USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- Políticas RLS para payment_methods
CREATE POLICY "Users can view payment methods from their store" ON public.payment_methods
  FOR SELECT USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert payment methods in their store" ON public.payment_methods
  FOR INSERT WITH CHECK (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update payment methods in their store" ON public.payment_methods
  FOR UPDATE USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete payment methods in their store" ON public.payment_methods
  FOR DELETE USING (store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid()));

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_job_roles_store ON public.job_roles(store_id);
CREATE INDEX IF NOT EXISTS idx_employees_store ON public.employees(store_id);
CREATE INDEX IF NOT EXISTS idx_employees_job_role ON public.employees(job_role_id);
CREATE INDEX IF NOT EXISTS idx_work_schedules_store ON public.work_schedules(store_id);
CREATE INDEX IF NOT EXISTS idx_work_schedules_employee ON public.work_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_clock_store ON public.time_clock_records(store_id);
CREATE INDEX IF NOT EXISTS idx_time_clock_employee ON public.time_clock_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_card_machines_store ON public.card_machines(store_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_store ON public.payment_methods(store_id);