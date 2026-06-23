## Resumen

Permitir que **socios actuales** (que pagan por SEPA o que se dieron de alta antes) puedan añadir/cambiar una tarjeta en Stripe desde su perfil (`/panel-socios`). Cuando lo hagan:

1. Se guarda el método de pago en Stripe **sin cobrar nada en ese momento**.
2. Se crea una suscripción en Stripe cuya **primera fecha de cobro = próxima fecha de pago** que ya tenían (mes/año según `tipo_pago` y `dia_cobro`).
3. En el panel de admin se ve claramente que el socio paga por **tarjeta** (Stripe) y no por SEPA.

## Cambios en BD (tabla `socios`)

Añadir columnas (todas opcionales):

- `stripe_payment_method_id` text
- `stripe_setup_intent_id` text
- `tarjeta_lista` boolean default false
- `metodo_pago_activo` text — `'sepa'` (por defecto) o `'tarjeta'`. Esta es la fuente de verdad para el panel admin.

(`stripe_customer_id` y `stripe_subscription_id` ya existen.)

## Flujo del socio en `/panel-socios`

Nueva sección "Método de pago" en la pestaña de cuenta:

```text
Si metodo_pago_activo = 'sepa':
   Muestra: "Actualmente pagas por domiciliación bancaria (SEPA)"
   Botón: [Cambiar a tarjeta]

Si metodo_pago_activo = 'tarjeta' y tarjeta_lista = true:
   Muestra: "Pagas con tarjeta ****1234"
   Botón: [Actualizar tarjeta]
```

Al pulsar el botón:

1. Llama a nueva edge fn `create-socio-card-setup` con el `socio_id` (autenticado).
2. La función crea/recupera el customer de Stripe, crea una Checkout Session `mode:'setup'` y devuelve la URL.
3. Se abre Stripe Checkout en una pestaña nueva.
4. Success URL → `/panel-socios/tarjeta-confirmada?session_id=...`
5. Esa página llama a `confirm-socio-card-update`, que:
   - Cancela la suscripción anterior si existía (`stripe_subscription_id` vigente).
   - Marca el nuevo `payment_method` como default del customer.
   - Calcula la **próxima fecha de pago** según `dia_cobro` y `tipo_pago` (ver más abajo) y crea la suscripción con `billing_cycle_anchor` = esa fecha y `proration_behavior: 'none'`. Así Stripe **no cobra hasta esa fecha**.
   - Guarda `stripe_subscription_id`, `stripe_payment_method_id`, `tarjeta_lista=true`, `metodo_pago_activo='tarjeta'` en `socios`.
6. Vuelve al panel con un toast "Tarjeta registrada. Próximo cobro: DD/MM/AAAA".

### Cálculo de "próxima fecha de pago"

- **Mensual**: el próximo día `dia_cobro` que esté en el futuro. Si `dia_cobro` ya pasó este mes → mes siguiente.
- **Anual**: misma lógica pero con la fecha aniversario. Si el socio no tiene fecha aniversario clara, usamos `dia_cobro` del mes de `fecha_alta`; si ya pasó este año → año siguiente.

Si por la razón que sea la fecha calculada está a menos de 24h, se desplaza al siguiente ciclo para evitar cobros inmediatos inesperados.

## Cambios en panel de admin (`AdminSocios.tsx`)

En la tabla de socios y en el diálogo de detalle:

- Badge junto al socio: **"SEPA"** (azul) o **"Tarjeta"** (verde si `tarjeta_lista=true`, gris ⏳ si pendiente).
- Filtro nuevo en la cabecera: "Método de pago: Todos / SEPA / Tarjeta".
- En el detalle: si es tarjeta, mostrar `stripe_subscription_id` y la próxima fecha de cobro (si la podemos sacar del campo o vía función). Sencillo: solo mostrar el badge y los IDs.

## Edge functions a crear

1. `create-socio-card-setup` (`verify_jwt = true`)
   - Valida que el usuario autenticado es ese socio (`socios.user_id = auth.uid()`).
   - Crea customer si no existe, abre Checkout Session `mode:'setup'` con metadata `socio_id`.
   - Devuelve `{ url }`.

2. `confirm-socio-card-update` (`verify_jwt = true`)
   - Recibe `session_id`.
   - Valida que el `socio_id` del metadata pertenece al usuario.
   - Cancela suscripción previa (si la hay).
   - Crea nueva suscripción con `billing_cycle_anchor` calculado.
   - Actualiza `socios`.

## Lo que NO toca este cambio

- Flujo público de `/hazte-socio` (sigue igual, ya implementado).
- Flujo SEPA actual y cobros existentes (no se cancela nada de SEPA, solo se cambia la marca `metodo_pago_activo` cuando completan la tarjeta).
- Webhooks de Stripe (no necesarios).

## Preguntas antes de implementar

1. Cuando un socio que pagaba por SEPA pasa a tarjeta, **¿quieres que el sistema marque automáticamente que ya no se le cobra por SEPA** (`metodo_pago_activo='tarjeta'`) o prefieres que admin lo confirme manualmente?
2. ¿Mostramos también un botón "Volver a SEPA" en el panel del socio o eso solo lo gestiona admin?
3. Para socios sin `dia_cobro` definido, ¿uso el día 1 del mes siguiente como fallback?
