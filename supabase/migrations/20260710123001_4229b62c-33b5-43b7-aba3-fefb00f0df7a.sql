
CREATE TABLE public.radar_preguntas (
  id TEXT PRIMARY KEY,
  categoria TEXT NOT NULL,
  texto TEXT NOT NULL,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  orden INTEGER NOT NULL DEFAULT 100,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.radar_preguntas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.radar_preguntas TO authenticated;
GRANT ALL ON public.radar_preguntas TO service_role;

ALTER TABLE public.radar_preguntas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active radar questions"
  ON public.radar_preguntas FOR SELECT
  USING (activa = true OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert radar questions"
  ON public.radar_preguntas FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update radar questions"
  ON public.radar_preguntas FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete radar questions"
  ON public.radar_preguntas FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER radar_preguntas_updated_at
  BEFORE UPDATE ON public.radar_preguntas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.radar_preguntas (id, categoria, texto, scores, orden) VALUES
('q1','Economía','Hay que reducir los impuestos directos a empresas y autónomos para estimular la actividad económica.','{"PP":5,"PSOE":2,"VOX":5,"SUMAR":1,"PODEMOS":1,"CIUDADANOS":5}',10),
('q2','Economía','El salario mínimo interprofesional debe seguir subiendo hasta alcanzar el 60% del salario medio.','{"PP":2,"PSOE":5,"VOX":2,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":3}',20),
('q3','Economía','Debe implantarse una jornada laboral de 32-35 horas sin reducción salarial.','{"PP":1,"PSOE":4,"VOX":1,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":2}',30),
('q4','Economía','Grandes fortunas y bancos deben pagar impuestos extraordinarios permanentes.','{"PP":1,"PSOE":4,"VOX":1,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":2}',40),
('q5','Modelo Territorial','Es necesario recentralizar competencias autonómicas como educación o sanidad para asegurar la homogeneidad.','{"PP":3,"PSOE":1,"VOX":5,"SUMAR":1,"PODEMOS":1,"CIUDADANOS":2}',50),
('q6','Modelo Territorial','Cataluña y País Vasco deberían poder celebrar referéndums de autodeterminación pactados con el Estado.','{"PP":1,"PSOE":1,"VOX":1,"SUMAR":2,"PODEMOS":4,"CIUDADANOS":1}',60),
('q7','Vivienda','El Estado debe intervenir y regular el precio máximo del alquiler en zonas tensionadas.','{"PP":1,"PSOE":5,"VOX":1,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":3}',70),
('q8','Vivienda','La solución al problema de vivienda pasa por liberar suelo y ayudar a comprar, no por regular alquileres.','{"PP":5,"PSOE":2,"VOX":4,"SUMAR":1,"PODEMOS":1,"CIUDADANOS":5}',80),
('q9','Energía','Debe prolongarse la vida útil de las centrales nucleares actuales como energía de transición.','{"PP":5,"PSOE":1,"VOX":4,"SUMAR":1,"PODEMOS":1,"CIUDADANOS":4}',90),
('q10','Medioambiente','España debe acelerar el cierre del diésel/gasolina y priorizar coche eléctrico y transporte público.','{"PP":2,"PSOE":4,"VOX":1,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":3}',100),
('q11','Derechos LGTBI','La ley trans (autodeterminación de género sin informe médico) debe mantenerse tal cual.','{"PP":1,"PSOE":4,"VOX":1,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":1}',110),
('q12','Aborto y Eutanasia','El derecho al aborto y a la eutanasia deben blindarse constitucionalmente.','{"PP":1,"PSOE":5,"VOX":1,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":3}',120),
('q13','Seguridad','Hay que endurecer las penas de cárcel y ampliar los efectivos policiales.','{"PP":5,"PSOE":2,"VOX":5,"SUMAR":1,"PODEMOS":1,"CIUDADANOS":4}',130),
('q14','Educación','La educación concertada debe recibir financiación pública en igualdad con la pública.','{"PP":5,"PSOE":2,"VOX":5,"SUMAR":1,"PODEMOS":1,"CIUDADANOS":4}',140),
('q15','Educación','Debe eliminarse la asignatura de religión del horario lectivo en la escuela pública.','{"PP":1,"PSOE":3,"VOX":1,"SUMAR":4,"PODEMOS":5,"CIUDADANOS":3}',150),
('q16','Inmigración','Hay que endurecer los controles migratorios y facilitar las deportaciones de irregulares.','{"PP":4,"PSOE":2,"VOX":5,"SUMAR":1,"PODEMOS":1,"CIUDADANOS":4}',160),
('q17','Inmigración','Los inmigrantes en situación irregular deben tener acceso pleno a sanidad y servicios sociales.','{"PP":2,"PSOE":4,"VOX":1,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":3}',170),
('q18','Memoria Histórica','La Ley de Memoria Democrática debe mantenerse y ampliarse.','{"PP":1,"PSOE":5,"VOX":1,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":2}',180),
('q19','Unión Europea','España debe aumentar su gasto militar hasta el 2% del PIB comprometido con la OTAN.','{"PP":5,"PSOE":3,"VOX":5,"SUMAR":1,"PODEMOS":1,"CIUDADANOS":5}',190),
('q20','Igualdad','Las políticas específicas de igualdad de género (Ministerio de Igualdad, leyes de paridad) son necesarias.','{"PP":2,"PSOE":5,"VOX":1,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":3}',200),
('q21','Regeneración','Deben suprimirse las Diputaciones Provinciales por ser una duplicidad administrativa.','{"PP":1,"PSOE":2,"VOX":4,"SUMAR":4,"PODEMOS":5,"CIUDADANOS":5}',210),
('q22','Regeneración','Hay que suprimir los aforamientos de políticos y altos cargos.','{"PP":2,"PSOE":3,"VOX":4,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":5}',220),
('q23','Sistema electoral','Debe implantarse un sistema de listas electorales abiertas y desbloqueadas.','{"PP":2,"PSOE":2,"VOX":3,"SUMAR":4,"PODEMOS":5,"CIUDADANOS":5}',230),
('q24','Sistema electoral','El alcalde debe ser el cabeza de la lista más votada (elección directa).','{"PP":4,"PSOE":1,"VOX":3,"SUMAR":1,"PODEMOS":1,"CIUDADANOS":5}',240),
('q25','Laicidad','Debe derogarse el Concordato con la Santa Sede y avanzar hacia un Estado plenamente aconfesional.','{"PP":1,"PSOE":3,"VOX":1,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":4}',250),
('q26','Derechos civiles','Debe legalizarse la gestación subrogada altruista (no comercial) en España.','{"PP":2,"PSOE":2,"VOX":2,"SUMAR":1,"PODEMOS":1,"CIUDADANOS":5}',260),
('q27','Educación','Debe implantarse un ''MIR educativo'': examen y residencia obligatoria para acceder a docente.','{"PP":3,"PSOE":4,"VOX":2,"SUMAR":3,"PODEMOS":3,"CIUDADANOS":5}',270),
('q28','Igualdad','España debe adoptar un modelo abolicionista de la prostitución (penalizar al cliente).','{"PP":3,"PSOE":5,"VOX":2,"SUMAR":3,"PODEMOS":2,"CIUDADANOS":1}',280),
('q29','Economía','Debe armonizarse la fiscalidad autonómica (Sucesiones, Patrimonio) para evitar competencia entre CCAA.','{"PP":1,"PSOE":5,"VOX":2,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":2}',290),
('q30','Cultura','Debe retirarse toda subvención y financiación pública a la tauromaquia.','{"PP":1,"PSOE":3,"VOX":1,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":3}',300),
('q31','Economía','El Ingreso Mínimo Vital debe ampliarse en cuantía y cobertura hasta erradicar la pobreza severa.','{"PP":2,"PSOE":5,"VOX":1,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":3}',310),
('q32','Igualdad','La Ley Integral contra la Violencia de Género (2004) debe mantenerse y reforzarse.','{"PP":3,"PSOE":5,"VOX":1,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":5}',320),
('q33','Modelo de Estado','Debe celebrarse un referéndum sobre monarquía o república.','{"PP":1,"PSOE":1,"VOX":1,"SUMAR":4,"PODEMOS":5,"CIUDADANOS":2}',330),
('q34','Economía','Sectores estratégicos (energía, banca) deben tener una empresa pública que compita con las privadas.','{"PP":1,"PSOE":3,"VOX":1,"SUMAR":5,"PODEMOS":5,"CIUDADANOS":1}',340),
('q35','Regeneración','Hay que reducir significativamente el número de diputados, senadores y cargos públicos.','{"PP":3,"PSOE":2,"VOX":5,"SUMAR":1,"PODEMOS":1,"CIUDADANOS":5}',350),
('q36','Modelo Territorial','Las comunidades autónomas deberían eliminarse y el Estado volver a ser fuertemente centralizado.','{"PP":2,"PSOE":1,"VOX":5,"SUMAR":1,"PODEMOS":1,"CIUDADANOS":2}',360);
