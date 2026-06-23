## Resumen

En el formulario de `/hazte-socio` el usuario podrá elegir **SEPA** (flujo actual sin cambios) o **Tarjeta**. Si elige tarjeta, se guardará el método de pago en Stripe **sin cobrar**, y el cargo se hará automáticamente sólo cuando la Junta apruebe la solicitud (mediante la creación de la suscripción). Si pasan 15 días sin aprobar (o se deniega), no se cobra nunca.

## Precios Stripe usados

- Cuota mensual (5€/mes) → `price_1TlZiSGds51tUOqDwqLQf1xQ`
- Cuota anual (50€/año) → `price_1TlZixGds51tUOqDZc30UxrY`

(Estos IDs están en modo **live**; las pruebas reales harán cargos reales salvo que pongamos el panel en test).

## Cambios en base de datos (`solicitudes_socio`)

Nuevas columnas (todas opcionales, no rompen lo existente):

- `metodo_pago` text — `'sepa'` (por defecto) o `'tarjeta'`
- `stripe_customer_id` text
- `stripe_setup_intent_id` text
- `stripe_payment_method_id` text
- `stripe_subscription_id` text — se rellena al aprobar
- `tarjeta_lista` boolean — `true` cuando el SetupIntent se ha confirmado

## Flujo nuevo en el formulario público

```text
Paso 1: datos personales + tipo de cuota (mensual/anual)
        + nuevo selector: ¿cómo quieres pagar? [SEPA] [Tarjeta]
   │
   ├── SEPA  → Paso 2 actual: IBAN  → FIN (espera a la Junta)
   │
   └── Tarjeta
         1. Se inserta la solicitud (metodo_pago='tarjeta')
         2. Edge fn `create-socio-setup` crea Stripe Customer
            + Checkout Session en mode:'setup'
         3. Redirección a Stripe Checkout (en nueva pestaña, igual que /dona)
         4. Success URL → /hazte-socio/tarjeta-confirmada?session_id=...
         5. Esa página llama a `confirm-socio-payment-method`
            que guarda setup_intent_id, payment_method_id y tarjeta_lista=true
         6. Pantalla "Tarjeta registrada. Te avisaremos cuando la Junta resuelva".
```

## Cambios en la aprobación (Junta)

Modificar `invite-socio` (ya existente). Cuando `solicitud.metodo_pago === 'tarjeta'` y hay `stripe_customer_id` + `stripe_payment_method_id`:

1. Marcar el `payment_method` como default del customer.
2. Crear la suscripción en Stripe con el `price_id` correspondiente al `tipo_pago` y `default_payment_method` ya configurado → Stripe cobra **en ese momento**.
3. Guardar `stripe_subscription_id` en la solicitud y en `socios`.
4. Si Stripe falla (tarjeta caducada, fondos…), devolver error a la admin y NO continuar con la activación.

Si la Junta **deniega** o pasan 15 días: simplemente no se ejecuta nada en Stripe. No hay cargos pendientes que cancelar (el SetupIntent no cobra). Opcional: cron de limpieza que borre customers huérfanos > 30 días.

## UI de admin

En la tabla y diálogo de detalle de solicitudes mostrar:
- Badge "SEPA" o "Tarjeta"
- Si tarjeta: estado de la tarjeta (✅ registrada / ⏳ pendiente de completar)
- Bloquear el botón "Aprobar" si eligió tarjeta pero `tarjeta_lista=false` (con mensaje claro).

## Edge Functions a crear

1. `create-socio-setup` (`verify_jwt = false`)
   - Input: `solicitud_id`
   - Valida que la solicitud existe, < 24h, `metodo_pago='tarjeta'`, sin customer aún
   - Crea Stripe Customer + Checkout Session `mode:'setup'`, `payment_method_types:['card']`, metadata con `solicitud_id`
   - Guarda `stripe_customer_id` en la solicitud
   - Devuelve `{ url }`

2. `confirm-socio-payment-method` (`verify_jwt = false`)
   - Input: `session_id`
   - Recupera la session de Stripe, extrae `setup_intent` y `payment_method`
   - Actualiza la solicitud (con check de que el `solicitud_id` del metadata coincide)
   - Devuelve OK

3. Modificación de `invite-socio` (existente) — añadir bloque "si tarjeta → crear suscripción".

## Notas técnicas

- Dominio de redirección: `https://ahoraorg.es` (memoria del proyecto).
- Se mantiene `verify_jwt = false` en las nuevas funciones porque la solicitud es pública (igual que `completar-iban`). Validación: la solicitud debe existir y haberse creado en las últimas 24h.
- No se tocan webhooks de Stripe (no son necesarios para este flujo).
- No se cambia el flujo SEPA actual ni el de donaciones.

## Lo que necesito de ti antes de implementar

- Confirma que los `price_id` de arriba son correctos (5€/mes y 50€/año, en EUR, recurrentes). ✅ ya verificado vía API.
- ¿Quieres que el botón "Aprobar" en admin muestre explícitamente "Esto cobrará XX€ ahora a la tarjeta" antes de confirmar? Recomendado.
- ¿Mantenemos los productos actuales en **live** o quieres que te configure todo en modo **test** primero para probar?

Si das luz verde, empiezo por la migración de BD y luego las funciones + frontend.
