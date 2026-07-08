# Problema

El workflow creó un caso duplicado sobre Ábalos/Koldo porque la deduplicación por `q=<título completo>` es demasiado estricta: exige que **todas** las palabras del nuevo título aparezcan en el título/descripción de un caso existente. Palabras como "Supremo", "mascarillas" o "condena" no estaban en los registros previos, así que `GET` devolvió `[]` y se creó igualmente.

Buscar por título nunca va a ser fiable: cada medio redacta distinto la misma noticia. La señal única y estable es la **URL de la fuente** (`fuente_url`) — es la misma para el mismo artículo, y ya la estás guardando.

# Solución

Mover la deduplicación al servidor (Edge Function `api-semaforo`), usando `fuente_url` como clave. Así n8n hace **una sola llamada POST** y el backend decide si crea, ignora o actualiza. Se acaba el problema y el workflow queda más simple.

## Cambios en la Edge Function `api-semaforo`

1. **POST con dedup automático por `fuente_url`:**
   - Si el body trae `fuente_url` y ya existe un caso con esa URL exacta:
     - Devolver `200` con `{ duplicate: true, data: <caso existente> }` en vez de crear.
   - Si no existe → crear como ahora y devolver `201`.
   - Si el body **no** trae `fuente_url` → crear siempre (comportamiento actual).

2. **Parámetro opcional `?mode=upsert`** en el POST:
   - Si `duplicate` y `mode=upsert`: actualizar los campos entrantes (descripcion, gravedad, ambito, fecha) en vez de solo devolver el existente. Útil si una noticia se amplía después.

3. **Filtro GET por `fuente_url`** (bonus, por si lo necesitas manualmente):
   - `GET ?fuente_url=<url>` devuelve el caso con esa URL exacta.

## Cambios en el workflow de n8n

- **Eliminar** los nodos `GET Buscar duplicado` y `IF ¿existe?`.
- Dejar sólo el `POST Crear caso` apuntando a la función. La respuesta indicará si se creó (`201`) o era duplicado (`200` + `duplicate: true`).
- Opcional: añadir `?mode=upsert` a la URL si quieres que sobrescriba con datos más nuevos.

## Detalles técnicos

- Tabla `casos_semaforo` ya tiene `fuente_url` (nullable). No hace falta migración obligatoria.
- Recomendado (opcional): añadir índice único parcial `CREATE UNIQUE INDEX ON casos_semaforo (fuente_url) WHERE fuente_url IS NOT NULL;` para garantizar unicidad también a nivel BD. Requiere limpiar duplicados existentes primero — te lo digo antes de aplicarlo.
- El chequeo en la función se hace con `SELECT ... WHERE fuente_url = $1 LIMIT 1` antes del `INSERT`.

## Fuera de alcance

- Deduplicación por similitud semántica de títulos (requeriría embeddings). Si más adelante quieres detectar cuándo dos URLs distintas cubren la misma noticia, lo abordamos aparte.
- Limpieza retroactiva de los duplicados que ya haya en la tabla (te lo listo cuando quieras).
