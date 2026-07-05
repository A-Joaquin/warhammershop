/** Modelo de datos del frontend. Refleja el esquema del brief §6
 *  (Supabase/PostgreSQL) para que el back encaje sin fricción. */

export type ProductStatus =
  | "available"
  | "reserved"
  | "sold"
  | "coming_soon";

export type ProductCondition = "nuevo" | "caja_abierta" | "usado";

export type ImageKind = "official" | "store";

export interface ProductImage {
  url: string;
  kind: ImageKind;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  faction: string; // slug de facción
  line: string; // set / línea
  sku: string;
  description: string;
  condition: ProductCondition;
  price: number; // precio de VENTA (el que ve el cliente)
  currency: string;
  status: ProductStatus;
  releaseDate?: string; // ISO, para coming_soon
  isPreorder?: boolean;
  stockQty: number;
  featured?: boolean;
  clicks?: number; // nº de visitas a la ficha (contador público)
  images: ProductImage[];
  // --- Gestión interna (admin) ---
  category?: string; // categoría principal (tipo de pieza)
  category2?: string; // categoría secundaria (opcional)
  purchasePrice?: number; // lo que costó la pieza en BOB (sin impuesto)
  purchasePriceUsd?: number; // costo equivalente en USD al comprar (par de monedas)
  taxRate?: number; // % de impuesto sobre la compra
  discount?: ProductDiscount; // descuento vigente (si tiene)
}

export interface ProductDiscount {
  id: string;
  type: "percentage" | "fixed";
  value: number;
  validFrom?: string; // "YYYY-MM-DD"
  validUntil?: string; // "YYYY-MM-DD"
  createdAt: string;
}

/** ¿Sigue vigente el descuento hoy? (respeta validFrom/validUntil si están cargados). */
export function isDiscountActive(
  discount: ProductDiscount | undefined,
  today: Date = new Date()
): boolean {
  if (!discount) return false;
  const day = today.toISOString().slice(0, 10);
  if (discount.validFrom && day < discount.validFrom) return false;
  if (discount.validUntil && day > discount.validUntil) return false;
  return true;
}

/** Precio final tras aplicar el descuento vigente (o el precio normal si no hay).
 *  En porcentaje, el monto se redondea siempre hacia arriba (a favor del cliente). */
export function discountedPrice(p: Pick<Product, "price" | "discount">): number {
  if (!isDiscountActive(p.discount)) return p.price;
  const off =
    p.discount!.type === "percentage"
      ? Math.ceil(p.price * (p.discount!.value / 100))
      : p.discount!.value;
  return Math.max(0, p.price - off);
}

/** Monto exacto que se resta del precio (ya con el redondeo de discountedPrice aplicado). */
export function discountAmount(p: Pick<Product, "price" | "discount">): number {
  return p.price - discountedPrice(p);
}

export interface Faction {
  slug: string;
  name: string;
  accent: string; // color hex de acento de la facción
  blurb: string;
}

/* ---------- Modelos de gestión interna (admin, brief §6) ---------- */

export type SaleChannel = "whatsapp" | "en_tienda" | "otro";

export interface Sale {
  id: string;
  productId: string;
  productName: string; // desnormalizado para el historial
  sku: string;
  soldPrice: number; // precio final de venta
  cost: number; // costo snapshot (compra + impuesto) en BOB al momento de vender
  costUsd?: number; // costo snapshot en USD (par de monedas)
  fxRate?: number; // tipo de cambio implícito BOB/USD al momento de comprar
  currency: string;
  soldAt: string; // ISO
  channel: SaleChannel;
  category?: string; // categoría principal (snapshot, para estadísticas)
  category2?: string; // 2ª categoría asignada en la venta
  buyerNote?: string;
  hidden: boolean; // oculta del listado admin sin borrar el registro
}

export interface ComboItem {
  productId: string;
  quantity: number;
  /** Preview del producto (solo lo carga el catálogo público, no el admin). */
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    currency: string;
    image?: string;
  };
}

export interface Combo {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  price: number;
  currency: string;
  items: ComboItem[];
}

/** Costo total de una pieza en BOB: compra + impuesto (%). */
export function productCost(
  p: Pick<Product, "purchasePrice" | "taxRate">
): number {
  const base = p.purchasePrice ?? 0;
  return base * (1 + (p.taxRate ?? 0) / 100);
}

/** Costo total de una pieza en USD: compra (USD) + impuesto (%). */
export function productCostUsd(
  p: Pick<Product, "purchasePriceUsd" | "taxRate">
): number {
  const base = p.purchasePriceUsd ?? 0;
  return base * (1 + (p.taxRate ?? 0) / 100);
}

export type ReservationStatus =
  | "pendiente"
  | "confirmada"
  | "cumplida"
  | "cancelada";

export interface Reservation {
  id: string;
  productId: string;
  productName: string; // desnormalizado
  customerName: string;
  whatsapp: string;
  email?: string;
  note?: string;
  status: ReservationStatus;
  createdAt: string; // ISO
}
