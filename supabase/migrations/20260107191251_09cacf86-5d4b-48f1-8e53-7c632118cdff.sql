-- Primero crear la función helper para verificar si el usuario es presidente o tesorero
CREATE OR REPLACE FUNCTION public.has_cargo_contable(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.socios s
    WHERE s.user_id = _user_id
      AND s.activo = true
      AND s.cargo_junta IN ('presidente', 'tesorero')
  ) OR has_role(_user_id, 'admin'::app_role)
$$;

-- Tabla de categorías de contabilidad
CREATE TABLE public.categorias_contabilidad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  color text DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categorias_contabilidad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Presidente y Tesorero pueden ver categorías"
ON public.categorias_contabilidad FOR SELECT
USING (has_cargo_contable(auth.uid()));

CREATE POLICY "Presidente y Tesorero pueden insertar categorías"
ON public.categorias_contabilidad FOR INSERT
WITH CHECK (has_cargo_contable(auth.uid()));

CREATE POLICY "Presidente y Tesorero pueden actualizar categorías"
ON public.categorias_contabilidad FOR UPDATE
USING (has_cargo_contable(auth.uid()));

CREATE POLICY "Presidente y Tesorero pueden eliminar categorías"
ON public.categorias_contabilidad FOR DELETE
USING (has_cargo_contable(auth.uid()));

-- Tabla de facturas (primero para poder referenciarla desde transacciones)
CREATE TABLE public.facturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  tipo text NOT NULL CHECK (tipo IN ('emitida', 'recibida')),
  concepto text NOT NULL,
  importe_base numeric(10,2) NOT NULL,
  iva_porcentaje numeric(4,2) DEFAULT 21.00,
  importe_iva numeric(10,2) GENERATED ALWAYS AS (importe_base * iva_porcentaje / 100) STORED,
  importe_total numeric(10,2) GENERATED ALWAYS AS (importe_base * (1 + iva_porcentaje / 100)) STORED,
  fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada', 'vencida', 'cancelada')),
  tercero_nombre text NOT NULL,
  tercero_nif text,
  tercero_direccion text,
  notas text,
  archivo_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Presidente y Tesorero pueden ver facturas"
ON public.facturas FOR SELECT
USING (has_cargo_contable(auth.uid()));

CREATE POLICY "Presidente y Tesorero pueden insertar facturas"
ON public.facturas FOR INSERT
WITH CHECK (has_cargo_contable(auth.uid()));

CREATE POLICY "Presidente y Tesorero pueden actualizar facturas"
ON public.facturas FOR UPDATE
USING (has_cargo_contable(auth.uid()));

CREATE POLICY "Presidente y Tesorero pueden eliminar facturas"
ON public.facturas FOR DELETE
USING (has_cargo_contable(auth.uid()));

-- Tabla de transacciones (ingresos y gastos)
CREATE TABLE public.transacciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  concepto text NOT NULL,
  descripcion text,
  importe numeric(10,2) NOT NULL,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  categoria_id uuid REFERENCES public.categorias_contabilidad(id) ON DELETE SET NULL,
  factura_id uuid REFERENCES public.facturas(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Presidente y Tesorero pueden ver transacciones"
ON public.transacciones FOR SELECT
USING (has_cargo_contable(auth.uid()));

CREATE POLICY "Presidente y Tesorero pueden insertar transacciones"
ON public.transacciones FOR INSERT
WITH CHECK (has_cargo_contable(auth.uid()));

CREATE POLICY "Presidente y Tesorero pueden actualizar transacciones"
ON public.transacciones FOR UPDATE
USING (has_cargo_contable(auth.uid()));

CREATE POLICY "Presidente y Tesorero pueden eliminar transacciones"
ON public.transacciones FOR DELETE
USING (has_cargo_contable(auth.uid()));

-- Triggers para updated_at
CREATE TRIGGER update_transacciones_updated_at
BEFORE UPDATE ON public.transacciones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facturas_updated_at
BEFORE UPDATE ON public.facturas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar categorías por defecto
INSERT INTO public.categorias_contabilidad (nombre, tipo, color) VALUES
('Cuotas de socios', 'ingreso', '#22C55E'),
('Donaciones', 'ingreso', '#10B981'),
('Subvenciones', 'ingreso', '#14B8A6'),
('Eventos', 'ingreso', '#06B6D4'),
('Otros ingresos', 'ingreso', '#0EA5E9'),
('Material y suministros', 'gasto', '#EF4444'),
('Servicios profesionales', 'gasto', '#F97316'),
('Alquiler y espacios', 'gasto', '#F59E0B'),
('Marketing y comunicación', 'gasto', '#EAB308'),
('Comisiones bancarias', 'gasto', '#84CC16'),
('Otros gastos', 'gasto', '#EC4899');