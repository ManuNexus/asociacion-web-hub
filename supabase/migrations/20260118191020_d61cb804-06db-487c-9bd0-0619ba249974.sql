-- Añadir columna para el miembro de junta asignado a cada contacto
ALTER TABLE public.contactos_directorio 
ADD COLUMN responsable_socio_id uuid REFERENCES public.socios(id) ON DELETE SET NULL;