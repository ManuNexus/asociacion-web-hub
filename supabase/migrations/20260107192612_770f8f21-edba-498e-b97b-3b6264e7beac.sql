-- Create proveedores table
CREATE TABLE public.proveedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  nif TEXT,
  direccion TEXT,
  email TEXT,
  telefono TEXT,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (same access as facturas - presidente y tesorero)
CREATE POLICY "Presidente y Tesorero pueden ver proveedores"
  ON public.proveedores FOR SELECT
  USING (has_cargo_contable(auth.uid()));

CREATE POLICY "Presidente y Tesorero pueden insertar proveedores"
  ON public.proveedores FOR INSERT
  WITH CHECK (has_cargo_contable(auth.uid()));

CREATE POLICY "Presidente y Tesorero pueden actualizar proveedores"
  ON public.proveedores FOR UPDATE
  USING (has_cargo_contable(auth.uid()));

CREATE POLICY "Presidente y Tesorero pueden eliminar proveedores"
  ON public.proveedores FOR DELETE
  USING (has_cargo_contable(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_proveedores_updated_at
  BEFORE UPDATE ON public.proveedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add proveedor_id to facturas table
ALTER TABLE public.facturas ADD COLUMN proveedor_id UUID REFERENCES public.proveedores(id) ON DELETE SET NULL;