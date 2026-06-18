# El Arsenal del Emperador — Web

Tienda de coleccionables Warhammer 40.000. Frontend construido con **Next.js 16
(App Router) + TypeScript + Tailwind v4**. Tema grimdark oscuro coherente con el
hero. Comercio por WhatsApp (sin checkout online, ver brief §9).

## Arrancar

```bash
npm run dev      # http://localhost:3000
npm run build    # build de producción
```

## Estructura

```
app/
  layout.tsx                 Fuentes (Oswald/Cinzel/Inter/JetBrains), header + footer, metadata
  page.tsx                   Home: hero + destacados + facciones + lanzamientos + CTA
  tienda/                    Catálogo (filtros, búsqueda, orden) — lee ?faction= de la URL
  producto/[slug]/           Ficha: galería oficial/tienda, WhatsApp, JSON-LD, relacionados
  proximos-lanzamientos/     coming_soon + formulario de reserva
  nosotros/  contacto/       Páginas de soporte
  not-found.tsx              404 con marca
components/
  hero.tsx                   Video dual-crossfade + brasas (canvas) + reveal (port de hero.html)
  site-header / site-footer  Navegación responsive (header transparente sobre el hero)
  catalog.tsx                Filtros/búsqueda/orden (client)
  product-card / product-gallery / reservation-form / status-badge / whatsapp-button
  ui/                        Primitivas estilo shadcn (button, input)
  section.tsx                Eyebrow / SectionHeading / PageIntro
lib/
  config.ts                  Datos del negocio (WhatsApp, dirección, horarios) → pasar a env en prod
  types.ts                   Modelo de datos (refleja el esquema Supabase del brief §6)
  data.ts                    DATOS MOCK + helpers (getAllProducts, getBySlug, getFeatured…)
  whatsapp.ts                Deep links wa.me con mensaje prellenado
  utils.ts                   cn(), formatPrice(), formatDate()
public/
  products/bt-0X.jpg         Fotos placeholder (Black Templar) — reemplazar por fotos reales
  video/hero-loop.mp4        Loop del hero
```

## Siguiente fase (backend)

Los datos viven en `lib/data.ts` (mock). Para el backend (brief §6–§7):

1. Supabase: tablas `products`, `product_images`, `sales`, `reservations`, `factions` + RLS.
2. Sustituir los helpers de `lib/data.ts` por consultas a Supabase (mismas firmas).
3. Mover `SITE.whatsapp` y la URL a variables de entorno.
4. Conectar `ReservationForm` a un Server Action que inserte en `reservations`.
5. Panel `/admin` (Supabase Auth): CRUD de productos, marcar vendido, gestión de reservas.
6. SEO: `sitemap.xml` + `robots.txt`, OG images.
