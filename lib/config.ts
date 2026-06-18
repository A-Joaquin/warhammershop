/**
 * Configuración global del negocio.
 *
 * La URL del sitio y el número de WhatsApp se pueden sobreescribir por variables
 * de entorno en producción (Vercel) sin tocar código; si no están, se usan los
 * valores por defecto de abajo. Ambas son `NEXT_PUBLIC_*` porque se usan también
 * en el navegador (enlaces de WhatsApp, JSON-LD, metadatos).
 */
export const SITE = {
  name: "El Arsenal del Emperador",
  tagline: "El plástico es eterno",
  description:
    "Miniaturas originales y piezas de colección Warhammer 40.000. Reserva próximos lanzamientos y coordina tu envío a todo el país por WhatsApp.",
  // URL pública del sitio (dominio real en producción). Override: NEXT_PUBLIC_SITE_URL.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://elarsenaldelemperador.com",
  // ───────────────────────────────────────────────────────────────────────
  // NÚMERO DE WHATSAPP DEL NEGOCIO
  // Formato wa.me: código de país + número, SIN el '+', SIN espacios ni guiones.
  // Ej.: el número +591 74167466 (Bolivia, cód. país 591) se escribe "59174167466".
  // Para cambiarlo: edita el valor por defecto de abajo, o define la variable de
  // entorno NEXT_PUBLIC_WHATSAPP (recomendado en producción).
  // (Se usa en toda la web: botones de WhatsApp del header, contacto, fichas y carrito.)
  // ───────────────────────────────────────────────────────────────────────
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "59174167466",
  email: "contacto@elarsenaldelemperador.com",
  city: "Santa Cruz de la Sierra, Bolivia",
  address: "Av. Imperial #2041, Galería El Bastión, Local M41",
  hours: "Lun a Sáb · 10:00 — 20:00",
  currency: "BOB",
  social: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com",
  },
} as const;

export const NAV_LINKS = [
  { label: "Catálogo", href: "/tienda" },
  { label: "Lanzamientos", href: "/proximos-lanzamientos" },
  { label: "La Tienda", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
] as const;

/**
 * Categoría dedicada para el "drop" de nuevos lanzamientos. Los productos que la
 * tengan (en `category` o `category2`) aparecen en el apartado de drops del home
 * y en el catálogo filtrado por ella.
 */
export const NEW_RELEASE_CATEGORY = "Nuevo lanzamiento";

/**
 * Drops (lotes) lanzados. Banner desplazable del home; cada uno lleva al catálogo
 * filtrado por la categoría de nuevos lanzamientos. Para añadir un drop: pon su
 * imagen en `public/banner-drops/` y agrega una entrada aquí.
 */
export const DROPS: { title: string; image: string }[] = [
  { title: "Night Lords", image: "/banner-drops/FNIGHTLORDS1.jpg" },
  { title: "Ultramarines", image: "/banner-drops/F-Ultramarines-.jpg" },
  { title: "Iron Warriors", image: "/banner-drops/ironwarrios.jpg" },
];
