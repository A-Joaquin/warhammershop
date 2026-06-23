# Configuración del contacto (WhatsApp y datos del negocio)

Todos los datos de contacto del negocio viven en **un solo archivo**:

```
lib/config.ts  →  objeto SITE
```

No están repartidos por el código. Cambiar el valor ahí actualiza **toda la web**
(header, página de contacto, fichas de producto, carrito, footer, etc.).

---

## Cambiar el número de WhatsApp

1. Abre `lib/config.ts`.
2. Edita **solo** la línea:

   ```ts
   whatsapp: "59174167466",
   ```

3. Guarda. En desarrollo (`npm run dev`) el cambio se ve al instante; en
   producción se aplica al volver a desplegar (build).

### Formato del número (importante)

Se usa el formato de **`wa.me`**: código de país + número, **sin** el `+`,
**sin** espacios y **sin** guiones.

| Número real        | Cómo se escribe aquí |
|--------------------|----------------------|
| +591 74167466      | `"59174167466"`      |
| +591 712 34567     | `"59171234567"`      |

- `591` es el código de país de **Bolivia**. Para otro país, cambia ese prefijo.
- Debe ir entre comillas (es texto), por ejemplo `whatsapp: "59174167466"`.

Si lo escribes con `+`, espacios o guiones, los enlaces de WhatsApp **no
funcionarán**.

### Cómo se usa internamente

El número se lee desde `SITE.whatsapp` en `lib/whatsapp.ts`, que arma los
enlaces `https://wa.me/<numero>?text=...` con el mensaje prellenado. Por eso
basta cambiarlo en un único lugar.

---

## Otros datos editables (mismo archivo `SITE`)

| Campo         | Para qué sirve                                  |
|---------------|-------------------------------------------------|
| `name`        | Nombre de la tienda                             |
| `tagline`     | Lema                                            |
| `description` | Descripción (SEO / metadatos)                   |
| `url`         | Dominio del sitio                               |
| `email`       | Correo de contacto                              |
| `city`        | Ciudad                                          |
| `address`     | Dirección física                               |
| `hours`       | Horario de atención                             |
| `currency`    | Moneda (`BOB`)                                  |
| `social`      | Enlaces de Instagram, Facebook y TikTok         |

> Nota: los números de teléfono que aparecen en `lib/admin-data.ts` son datos de
> **clientes de prueba** (reservas mock), no el número del negocio. No los
> confundas con `SITE.whatsapp`.
