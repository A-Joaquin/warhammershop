# Estado del proyecto — El Arsenal del Emperador

> Repaso de lo construido vs. los requerimientos del **brief**
> (`brief-tienda-warhammer40k.md`). Última actualización: **backend Supabase
> conectado** (vitrina + panel admin + auth real), funciones nuevas (clicks,
> par de monedas, drops) y subida real de imágenes.
> Resumen: **la tienda ya corre sobre Supabase de verdad** — la vitrina lee de la
> base, el panel `/admin` escribe en la base con login real (rol admin), las fotos
> se suben a Storage comprimidas, y las reservas públicas se guardan. Lo principal
> que falta es **el despliegue** (Vercel) y cierres de SEO. Ver §7 para el detalle
> de **esta sesión** y §8 para lo **pendiente / siguiente**.

---

## 1. Resumen rápido

| Bloque | Estado |
|---|---|
| **Frontend público** (catálogo, fichas, lanzamientos, soporte) | ✅ Hecho, **leyendo de Supabase** (ISR 60s) |
| **Intro parallax horizontal** (hero → mapa → galería) | ✅ Hecho (extra, muy pulido) |
| **Comercio por WhatsApp** (deep links) | ✅ Hecho |
| **Carrito de compra** (junta piezas → 1 pedido por WhatsApp) | ✅ Hecho (cliente, localStorage) |
| **Cuentas de cliente** (registro/login + Google + legión) | 🟡 UI **mock** (localStorage); falta migrar a Supabase Auth |
| **SEO base** (metadata, JSON-LD, slugs) | 🟡 Parcial (falta sitemap/robots/OG images) |
| **Panel de administración** (login, CRUD, ventas, reservas, lanzamientos) | ✅ Hecho, **escribiendo en Supabase** con **login real (rol admin)** |
| **Backend / base de datos** (Supabase) | ✅ **Conectado** (Postgres + Auth + Storage + RLS) |
| **Subida de imágenes** (Storage + compresión) | ✅ Hecho (comprime a WebP en el navegador → Storage; orden por arrastre con ↑/↓) |
| **Contador de clicks por producto** | ✅ Real (`increment_product_clicks` RPC) + ranking en estadísticas |
| **Par de monedas BOB/USD + inflación** | ✅ En base y en el panel de estadísticas |
| **Drops (carrusel hero) + categoría "Nuevo lanzamiento"** | ✅ Hecho (banners full-width autoplay; filtro por categoría) |
| **Reservas públicas** (formulario → tabla `reservations`) | ✅ Hecho (insert anónimo + WhatsApp) |
| **Despliegue** (Vercel + Supabase) | ❌ Falta |

---

## 2. ✅ Lo que YA está hecho (frontend)

### Páginas públicas (brief §5)
- `/` — Home: **intro parallax** + sellos de confianza + destacados + facciones + lanzamientos + CTA.
- `/tienda` — Catálogo con **búsqueda, filtros** (facción, estado), **orden** (novedad/precio/nombre) y drawer móvil. *(brief §4.1)*
- `/producto/[slug]` — Ficha: **galería oficial / fotos de tienda** (pestañas), precio, estado, condición, SKU, stock, **botón WhatsApp prellenado**, **relacionados**, **JSON-LD**. SSG (estática por producto). *(brief §4.2)*
- `/proximos-lanzamientos` — Lista de `coming_soon` + **formulario de reserva**. *(brief §4.4)*
- `/nosotros` y `/contacto` — páginas de soporte con WhatsApp, ubicación, horarios. *(brief §4.6)*
- `/not-found` — 404 con marca.

### Sistema visual y UX
- **Next.js 16 + TypeScript + Tailwind v4**, tema grimdark 40k. *(brief §7)*
- Header responsive (menú móvil) + footer.
- Primitivas UI (Button, Input) estilo shadcn.
- **Menú de color dinámico** (cambia el acento de toda la web en vivo) — *extra*.
- Estados de producto (Disponible / Reservado / Vendido / Próximo) con badges. *(brief §4.1)*
- Imágenes con `next/image` (AVIF/WebP, `priority` en el hero). *(brief §10)*

### WhatsApp (brief §9)
- Deep links `wa.me` con **mensaje prellenado** (producto + precio + enlace).
- Botón en ficha, contacto y header.

### Carrito de compra
- **Carrito de cliente** (`lib/cart-context.tsx`): provider con `useCart`,
  persistido en **localStorage** (`arsenal-cart`) — no se pierde al recargar/navegar.
- Solo entran piezas **disponibles** (no reservadas/vendidas/próximas); cantidad
  topada al `stockQty` (la mayoría son piezas únicas).
- **Drawer lateral** (`cart-drawer.tsx`) con miniatura, cantidad ±, total y
  botón de WhatsApp. Botón con **badge de cantidad** en el header (`cart-button.tsx`).
- **Añadir al carrito** en la ficha (`add-to-cart-button.tsx`) y **añadido rápido**
  en las tarjetas del catálogo (`card-add-button.tsx`).
- **Checkout = un solo mensaje de WhatsApp** con todas las piezas, subtotales,
  total y enlaces (`waCartLink` en `lib/whatsapp.ts`). Coherente con el modelo
  sin pago online. *(brief §9)*

### Cuentas de cliente — UI con datos mock *(cambio sobre el brief §11)*
> El brief decía "sin cuentas de cliente"; **se decidió añadirlas**.
- **Registro/login** con email + contraseña y **"Continuar con Google"** (el OAuth
  real llega con Supabase Auth; hoy está **simulado**) — `lib/account-context.tsx`,
  persistido en localStorage. ⚠️ No es seguridad real, solo UI.
- **Legión del cliente**: al registrarse **elige su legión** (leales y traidoras;
  `lib/legions.ts`) y puede cambiarla en su perfil.
- **`/cuenta`**: login/registro (`components/auth-panel.tsx`) o **perfil** con el
  ícono de su legión, datos y cambio de legión.
- **Ícono de legión** (`components/legion-badge.tsx`): hoy un escudo con color +
  iniciales; cuando lleguen los **logos** se rellena `legion.logo` y los usa solo.
- **Header**: menú de cuenta con el badge de la legión (`components/account-menu.tsx`).
- Pendiente futuro: **adaptar la página según la legión** del usuario.

### Panel de administración — UI con datos mock *(brief §4.5, §5)*
- **Acceso protegido (mock)**: contraseña única en `NEXT_PUBLIC_ADMIN_PASSWORD`
  (por defecto `arsenal40k`), sesión recordada en localStorage
  (`lib/admin-auth.tsx`). Se reemplaza por **Supabase Auth** sin tocar las pantallas.
- **Store mock** (`lib/admin-store.tsx`): productos + ventas + reservas +
  **categorías** sembrados desde `lib/data.ts` y `lib/admin-data.ts`,
  **persistidos en localStorage** — crear/editar/borrar y marcar vendido se
  sienten reales y sobreviven recargas.
- **Categorías dinámicas**: cada producto tiene categoría (y 2ª opcional); en el
  formulario se **elige una existente o se escribe una nueva** y se añade sola a
  la lista (combobox con `datalist`).
- **Precios y costo**: el producto guarda **precio de compra**, **impuesto (%)** y
  **precio de venta**. Costo = compra + impuesto; el formulario muestra **costo,
  ganancia y margen** en vivo. La venta guarda un **snapshot del costo** para la
  ganancia histórica (`productCost` en `lib/types.ts`).
- `/admin` — **Dashboard**: disponibles, vendidos del mes (ingresos + **ganancia**),
  reservas pendientes, próximos lanzamientos; ventas y reservas recientes.
- `/admin/productos` — **CRUD** completo con buscador (nombre/SKU/categoría) y
  filtros; formulario con todos los campos + categorías + precios + **editor de
  imágenes** (oficiales/tienda; muestras, URL o subida que genera data-URL).
- `/admin/ventas` — **registrar venta** con **buscador por nombre/SKU + filtro de
  facción** para encontrar la pieza, **2ª categoría** opcional (se guarda en la
  venta y en el producto), cambia a `sold` + inserta en `sales`; **historial** con
  filtro por fechas y **total acumulado**. *(brief §4.3)*
- `/admin/estadisticas` — **ingresos, costos, ganancia y margen** (totales y del
  mes), **ranking de categorías más vendidas** (qué categoría se vende más),
  ventas por canal y top productos.
- `/admin/reservas` — gestión de estado (pendiente/confirmada/cumplida/cancelada),
  enlace directo de WhatsApp al cliente. *(brief §4.4)*
- `/admin/lanzamientos` — gestión de `coming_soon`, nº de reservas por pieza y
  acción **publicar** (pasa a disponible).
- El chrome público (header/footer/carrito) se oculta bajo `/admin`
  (`components/site-chrome.tsx`); el admin trae su propio layout con sidebar.
- **Nota:** todo es de **cliente con datos mock**; la vitrina pública sigue
  leyendo de `lib/data.ts`, así que aún **no están conectados** (lo estarán cuando
  ambos lean de Supabase).

### SEO (brief §8) — base
- `metadata` por página (title, description), `lang="es"`, Open Graph.
- **JSON-LD `Product` + `Offer`** en la ficha (con `availability`).
- Slugs limpios (`/producto/black-templar-sword-brother`).
- HTML semántico, `alt` en imágenes, breadcrumbs en ficha.

### Rendimiento (brief §10)
- **GSAP cargado de forma diferida** (dynamic import) → no entra al bundle crítico.
- Respeta `prefers-reduced-motion` (intro y misiles).

### Documentación
- `docs/scroll-horizontal-parallax.md` — cómo funciona el intro y cómo mover/intercambiar texto e imágenes.

---

## 3. Estado del backend y lo que FALTA

### 3.1 Backend con Supabase *(brief §6, §7)* — ✅ **CONECTADO**
- [x] Proyecto Supabase (Postgres + Auth + Storage) creado y en uso.
- [x] Tablas + enums + funciones + RLS + seed ejecutados (`docs/supabase-schema.sql`).
- [x] **RLS** activa: catálogo lectura pública, escritura solo admin; `product_costs`/`sales` solo admin; `reservations` insert público + gestión admin.
- [x] Vitrina lee de Supabase vía `lib/catalog.ts` (async; reemplazó los helpers mock de `lib/data.ts`).
- [x] Cliente de servidor (`lib/supabase/server.ts`, anon, ISR) y de navegador (`lib/supabase/client.ts`, con sesión).

### 3.2 Panel de administración *(brief §4.5, §5)* — ✅ **CONECTADO**
- [x] **Login real** con Supabase Auth + verificación de `role='admin'` (`lib/admin-auth.tsx`).
- [x] CRUD de productos, ventas y reservas **escriben en la base** (`lib/admin-store.tsx`).
- [x] **Marcar vendido** vía RPC transaccional `mark_product_sold` (snapshots BOB/USD + fx).
- [x] **Subida real de imágenes** a Storage con compresión WebP (`lib/images.ts`) y **orden** con ↑/↓.
- [x] Admin y vitrina comparten la misma base (lo que edita el admin se ve en la tienda con ISR ≤60s).

### 3.3 Lógica de servidor *(brief §7)* — ✅ hecho lo esencial
- [x] **Crear reserva** → insert público en `reservations` desde el formulario (`components/reservation-form.tsx`).
- [x] **Marcar vendido** transaccional (RPC `mark_product_sold`).
- [x] **Clicks**: RPC `increment_product_clicks` (público) desde la ficha.
- [ ] *(futuro)* mover lecturas/escrituras sensibles a Server Actions/Route Handlers si se quiere endurecer (hoy van por el cliente de navegador con RLS, que ya protege).

### 3.4 SEO / rendimiento — cierre *(brief §8, §10)*
- [ ] `sitemap.xml` + `robots.txt` (con `next-sitemap`), regenerar al publicar.
- [ ] **OG images** por producto (imagen principal en las cards sociales).
- [ ] **Paginación o scroll infinito** en el catálogo (hoy muestra todo).
- [ ] Analítica (Vercel Analytics o Plausible).
- [ ] Pase final de Core Web Vitals (LCP < 2.5s).

### 3.5 Despliegue *(brief §7)*
- [ ] **Vercel** (frontend) + **Supabase Cloud** (DB/Auth/Storage).
- [ ] Variables de entorno: **número de WhatsApp**, URL del sitio, claves de Supabase (hoy el número vive en `lib/config.ts`, debe pasar a `.env`).

### 3.6 Contenido real
- [ ] Reemplazar **fotos placeholder** (el Black Templar repetido) por fotos reales de producto.
- [ ] Cargar el **inventario real**.

---

## 4. Decisiones pendientes del brief (§13)

| # | Decisión | Estado |
|---|---|---|
| 1 | Nombre de la tienda | ✅ "El Arsenal del Emperador" |
| 1 | **Número de WhatsApp real** | ❌ Placeholder (`59170000000`) — falta el real |
| 2 | Moneda | 🟡 Asumido **BOB** (Bs) — confirmar |
| 3 | Stock (¿todas únicas?) | 🟡 Soporta `stockQty` (1 por defecto) |
| 4 | Reservas (¿solo formulario?) | ✅ Solo formulario (sin cuenta para reservar) |
| 11 | **Cuentas de cliente** | 🔄 Cambio: **SÍ habrá** cuentas (email+Google) con legión |
| 5 | Idioma | ✅ Solo español |
| 7 | Tema del catálogo | 🟡 Se hizo **oscuro 40k** (el brief sugería claro tipo Shopify) — confirmar si gusta o se quiere claro/toggle |

---

## 5. Orden sugerido para continuar

> ✅ Frontend + **backend Supabase conectado** (vitrina, admin real, auth, clicks,
> reservas, imágenes). **← Estamos aquí.** Falta sobre todo **desplegar** y pulir.

1. ~~Supabase setup + vitrina + auth/admin + ventas/reservas~~ ✅ **HECHO**.
2. **Migrar cuentas de cliente** (`lib/account-context.tsx`) a Supabase Auth real
   (hoy mock localStorage). La tabla `profiles` y el trigger ya existen.
3. **Cierre SEO/rendimiento**: sitemap/robots/OG, paginación del catálogo, analítica.
4. **Despliegue**: Vercel + variables de entorno (WhatsApp real, URL del sitio,
   claves Supabase ya en `.env.local`).
5. **Contenido real**: fotos reales (subir vía el admin → Storage) e inventario real.

---

## 6. 📌 Notas para el SCRIPT de Supabase (consolidado)

> Checklist de TODO lo acordado que el SQL/seed debe contemplar. Refleja el
> estado actual del mock (`lib/*`), no solo el brief original.

### Tablas
- **`factions`** — facciones de producto (Space Marines, Necrons…); seed desde `lib/data.ts`.
- **`categories`** — categorías de pieza (Personaje, Escuadra, Tropas, Vehículo,
  Monstruo…). **Dinámicas**: el admin crea nuevas al vuelo. Seed desde `lib/admin-data.ts`.
- **`products`** — además del brief §6, columnas internas ya en uso:
  `category`, `category2`, `purchase_price`, `tax_rate` (% impuesto sobre compra).
  `price` = precio de **venta** (público). Costo = `purchase_price` + impuesto.
  **Nuevo:** `clicks` (contador de visitas a la ficha; se incrementa con la función
  pública `increment_product_clicks()`).
- **`product_costs`** — costo separado del producto. **Par de monedas:**
  `purchase_price` (BOB) + `purchase_price_usd` (USD) + `fx_rate` (BOB/USD,
  columna generada) para **medir inflación/devaluación** en el tiempo.
- **`product_images`** — `kind` ∈ (official, store); subir a **Storage**.
- **`sales`** — `sold_price`, **`cost`** (snapshot compra+impuesto en BOB al
  vender), **`cost_usd`** y **`fx_rate`** (snapshots del par de monedas),
  `channel` ∈ (whatsapp, en_tienda, otro), **`category`** y **`category2`**
  (snapshot para estadísticas), `buyer_note`, `sold_at`.
- **`reservations`** — como brief §6 (estado pendiente/confirmada/cumplida/cancelada).
  `user_id` opcional (preparado para vincular reservas de clientes logueados; el
  formulario anónimo lo deja en `null`).
- **`profiles`** — perfil del cliente ligado a `auth.users`: `name`, `legion`
  (id de legión), `provider`, `created_at`.
- **`legions`** — catálogo de legiones/capítulos del cliente; seed desde
  `lib/legions.ts` (id, name, accent, allegiance loyalist/traitor, motto, logo).

### Auth
- **Supabase Auth**: email+password **y Google OAuth** para clientes
  (reemplaza el mock de `lib/account-context.tsx`).
- **Rol admin** separado para el panel `/admin` (reemplaza la compuerta por
  contraseña de `lib/admin-auth.tsx`).

### RLS
- `products`/`product_images`/`factions`/`categories`/`legions`: **lectura pública**;
  escritura solo admin.
- `reservations`: **insert público** (formulario), lectura/gestión solo admin.
- `sales`: solo admin.
- `profiles`: cada usuario ve/edita **el suyo**; admin puede leer.

### Lógica de servidor
- **Marcar vendido**: Server Action transaccional → `products.status='sold'`,
  `stock_qty=0`, set `category2` y **insert en `sales`** con el `cost` snapshot.
- **Crear reserva**: insert público desde el formulario (hoy solo abre WhatsApp).

### Notas de comportamiento (ya implementado en el front)
- El **carrito** y las **cuentas** son de cliente; solo necesitan validar
  stock/estado contra la base antes de generar pedido.
- **Estadísticas**: la 2ª categoría suma **unidades** pero no ingresos (evita
  doble conteo). Ganancia = `sold_price - cost`.
- **Estadísticas nuevas** (panel `/admin/estadisticas`): **productos más vistos**
  (ranking de `clicks`) y **curva de inflación** (tipo de cambio implícito BOB/USD
  promedio por mes + costo del inventario en ambas monedas). Consultas listas en
  `docs/supabase-schema.md` §14.
- Futuro: **personalizar la web según la legión** del usuario (color/acento/logo).

---

## 7. 🛠️ Bitácora — sesión de conexión a Supabase

> Qué se hizo en la sesión que conectó el backend. Útil para retomar contexto.

### Infraestructura
- **Proyecto Supabase creado** y SQL ejecutado desde `docs/supabase-schema.sql`
  (script consolidado e idempotente). Incluye el fix del trigger `guard_profile_role`
  (permite el bootstrap del primer admin desde el SQL editor, donde `auth.uid()` es null).
- **`@supabase/supabase-js` instalado.** Claves en **`.env.local`** (gitignored):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (la anon key es pública por diseño).
- Clientes: `lib/supabase/client.ts` (navegador, singleton con sesión),
  `lib/supabase/server.ts` (anon, lecturas públicas SSG/ISR), `lib/supabase/types.ts`
  (tipo `Database` mínimo permisivo, sin tipos generados).

### Vitrina pública → Supabase
- `lib/catalog.ts` (async): `getAllProducts`, `getProductBySlug`, `getFeatured`,
  `getComingSoon`, `getRelated`, `getByCategory`. Mapea snake_case → `Product` con imágenes anidadas.
- Páginas `/`, `/tienda`, `/producto/[slug]`, `/proximos-lanzamientos` ahora son async con `revalidate = 60` (ISR).
- `lib/data.ts` conserva `FACTIONS`/`factionName`/`factionAccent` (con fallback `prettifySlug`) y `PRODUCTS` ya **no** alimenta la vitrina.

### Admin real
- **Auth**: `lib/admin-auth.tsx` (Supabase Auth + chequeo `role='admin'`); `admin-login.tsx` pide email+contraseña.
- **Store**: `lib/admin-store.tsx` lee/escribe en Supabase (products+costs+images, sales, reservations, categories, **factions**). Mutaciones async; recarga tras cada cambio.
- **Usuario admin** se crea en *Authentication → Users → Add user* (Auto Confirm) y luego `update public.profiles set role='admin' where email='...'`.

### Funciones nuevas
- **Clicks reales**: `components/product-click-tracker.tsx` llama al RPC `increment_product_clicks`; estadísticas leen `products.clicks`. (Se eliminó el `lib/clicks.ts` mock.)
- **Par de monedas BOB/USD**: costo en ambas monedas + `fx_rate` generado; panel de inflación en `/admin/estadisticas`.
- **Imágenes**: `lib/images.ts` comprime a **WebP** en el navegador y sube a Storage (bucket `product-images`); `next.config.ts` autoriza el host de Supabase para `next/image`. **Subida múltiple** (en paralelo) y **orden** con ↑/↓ (primera = portada → `sort_order`).
- **Facción/marca creable al vuelo** en el formulario (combobox); se crea en `factions` si es nueva. El catálogo deriva los filtros de facción/categoría de los productos.
- **Drops**: carrusel hero full-width con autoplay (`components/drop-slider.tsx`), banners en `public/banner-drops/`, configurados en `DROPS` (`lib/config.ts`); enlazan al catálogo filtrado por la categoría **`Nuevo lanzamiento`** (`NEW_RELEASE_CATEGORY`).
- **Reservas públicas**: `components/reservation-form.tsx` inserta en `reservations` (insert anónimo) además de WhatsApp.

### ⚠️ Gotchas para recordar
- **No** guardar imágenes como data-URL base64 en la base (infla `product_images` a MB y hace lentísimas las consultas). Siempre vía Storage (ya está así).
- Inserts anónimos (reservas, clicks) usan `.insert()`/`.rpc()` **sin `.select()`** para no chocar con la RLS de lectura.
- El typing de `supabase-js` sin tipos generados obliga a castear resultados (`as unknown as ...`) — patrón ya aplicado en `catalog.ts` y `admin-store.tsx`.

---

## 8. ▶️ Para la siguiente sesión

**Pendiente principal (en orden sugerido):**
1. **Cuentas de cliente reales**: migrar `lib/account-context.tsx` del mock localStorage a Supabase Auth (email + Google OAuth). `profiles` + trigger `handle_new_user` ya existen; el contrato de metadata en signUp es `{ name, legion, provider }`. Activar Google en *Auth → Providers*.
2. **SEO/rendimiento**: `sitemap.xml` + `robots.txt`, OG images por producto, paginación del catálogo, analítica.
3. **Despliegue en Vercel**: subir env vars (`NEXT_PUBLIC_SUPABASE_*`, número de WhatsApp real, URL del sitio). Mover el WhatsApp de `lib/config.ts` a env.
4. **Contenido real**: fotos reales por el admin (se comprimen y van a Storage) e inventario real.

**Datos útiles:**
- Esquema/script: `docs/supabase-schema.md` (explicado) y `docs/supabase-schema.sql` (ejecutable).
- Para correr: `npm run dev`. Build de verificación: `npm run build`.
- El admin requiere una cuenta con `profiles.role='admin'`.
