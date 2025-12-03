-- Create table for active members (socios)
CREATE TABLE public.socios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    nombre text NOT NULL,
    apellidos text NOT NULL,
    email text NOT NULL,
    telefono text,
    fecha_alta timestamp with time zone NOT NULL DEFAULT now(),
    activo boolean NOT NULL DEFAULT true,
    tipo_cuota text NOT NULL DEFAULT 'normal',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.socios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Socios can view active members"
ON public.socios
FOR SELECT
USING (has_role(auth.uid(), 'socio') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert socios"
ON public.socios
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update socios"
ON public.socios
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete socios"
ON public.socios
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create table for voting/votaciones
CREATE TABLE public.votaciones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo text NOT NULL,
    descripcion text,
    fecha_inicio timestamp with time zone NOT NULL DEFAULT now(),
    fecha_fin timestamp with time zone NOT NULL,
    activa boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.votaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Socios can view votaciones"
ON public.votaciones
FOR SELECT
USING (has_role(auth.uid(), 'socio') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage votaciones insert"
ON public.votaciones
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage votaciones update"
ON public.votaciones
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage votaciones delete"
ON public.votaciones
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create table for voting options
CREATE TABLE public.opciones_votacion (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    votacion_id uuid REFERENCES public.votaciones(id) ON DELETE CASCADE NOT NULL,
    texto text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.opciones_votacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Socios can view opciones"
ON public.opciones_votacion
FOR SELECT
USING (has_role(auth.uid(), 'socio') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage opciones insert"
ON public.opciones_votacion
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage opciones update"
ON public.opciones_votacion
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage opciones delete"
ON public.opciones_votacion
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create table for votes
CREATE TABLE public.votos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    votacion_id uuid REFERENCES public.votaciones(id) ON DELETE CASCADE NOT NULL,
    opcion_id uuid REFERENCES public.opciones_votacion(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(votacion_id, user_id)
);

ALTER TABLE public.votos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Socios can insert own vote"
ON public.votos
FOR INSERT
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'socio'));

CREATE POLICY "Socios can view own votes"
ON public.votos
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Create table for events
CREATE TABLE public.eventos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo text NOT NULL,
    descripcion text,
    fecha timestamp with time zone NOT NULL,
    ubicacion text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Socios can view eventos"
ON public.eventos
FOR SELECT
USING (has_role(auth.uid(), 'socio') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage eventos insert"
ON public.eventos
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage eventos update"
ON public.eventos
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage eventos delete"
ON public.eventos
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create table for internal documentation
CREATE TABLE public.documentos_internos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo text NOT NULL,
    descripcion text,
    archivo_url text NOT NULL,
    categoria text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos_internos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Socios can view documentos"
ON public.documentos_internos
FOR SELECT
USING (has_role(auth.uid(), 'socio') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage documentos insert"
ON public.documentos_internos
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage documentos update"
ON public.documentos_internos
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage documentos delete"
ON public.documentos_internos
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_socios_updated_at
BEFORE UPDATE ON public.socios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_votaciones_updated_at
BEFORE UPDATE ON public.votaciones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_eventos_updated_at
BEFORE UPDATE ON public.eventos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documentos_updated_at
BEFORE UPDATE ON public.documentos_internos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();