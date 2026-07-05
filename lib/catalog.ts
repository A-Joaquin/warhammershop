/**
 * Capa de datos del catálogo público (Supabase).
 *
 * Reemplaza los antiguos helpers mock de `lib/data.ts`. Las firmas son las mismas
 * (`getAllProducts`, `getProductBySlug`, `getFeatured`, `getComingSoon`,
 * `getRelated`) pero ahora son **async** y leen de Supabase. Las páginas que las
 * usan son Server Components, así que basta con `await`.
 *
 * Si una consulta falla, se registra y se devuelve un fallback vacío para que la
 * vitrina degrade con elegancia en vez de tirar la página entera.
 */
import type { Combo, ComboItem, Product } from "./types";
import { createPublicClient } from "./supabase/server";

// products + sus imágenes (join anidado de PostgREST)
const SELECT = "*, product_images(url,kind,alt_text,sort_order)";

// combos + sus productos incluidos (join anidado de PostgREST)
const COMBO_SELECT =
  "*, combo_items(quantity, sort_order, product:products(id,name,slug,price,currency,product_images(url,sort_order)))";

interface DbImage {
  url: string;
  kind: Product["images"][number]["kind"];
  alt_text: string | null;
  sort_order: number | null;
}

interface DbProduct {
  id: string;
  slug: string;
  name: string;
  faction: string;
  line: string | null;
  sku: string;
  description: string | null;
  condition: Product["condition"];
  price: number | string;
  currency: string;
  status: Product["status"];
  release_date: string | null;
  is_preorder: boolean | null;
  stock_qty: number;
  featured: boolean | null;
  clicks: number | null;
  category: string | null;
  category2: string | null;
  product_images: DbImage[] | null;
}

/** Mapea una fila de Supabase (snake_case) al modelo `Product` del front. */
function mapProduct(r: DbProduct): Product {
  const images = (r.product_images ?? [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((i) => ({ url: i.url, kind: i.kind, alt: i.alt_text ?? "" }));
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    faction: r.faction,
    line: r.line ?? "",
    sku: r.sku,
    description: r.description ?? "",
    condition: r.condition,
    price: Number(r.price),
    currency: r.currency,
    status: r.status,
    releaseDate: r.release_date ?? undefined,
    isPreorder: r.is_preorder ?? undefined,
    stockQty: r.stock_qty,
    featured: r.featured ?? undefined,
    clicks: r.clicks ?? 0,
    images,
    category: r.category ?? undefined,
    category2: r.category2 ?? undefined,
  };
}

interface DbComboItemProduct {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  currency: string;
  product_images: { url: string; sort_order: number | null }[] | null;
}
interface DbComboItem {
  quantity: number;
  sort_order: number | null;
  product: DbComboItemProduct | null;
}
interface DbCombo {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
  price: number | string;
  currency: string;
  combo_items: DbComboItem[] | null;
}

function mapCombo(r: DbCombo): Combo {
  const items: ComboItem[] = (r.combo_items ?? [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .filter((i) => i.product)
    .map((i) => {
      const cover = (i.product!.product_images ?? [])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
      return {
        productId: i.product!.id,
        quantity: i.quantity,
        product: {
          id: i.product!.id,
          name: i.product!.name,
          slug: i.product!.slug,
          price: Number(i.product!.price),
          currency: i.product!.currency,
          image: cover?.url,
        },
      };
    });
  return {
    id: r.id,
    name: r.name,
    slug: r.slug ?? "",
    description: r.description ?? "",
    imageUrl: r.image_url,
    price: Number(r.price),
    currency: r.currency,
    items,
  };
}

export interface CatalogFaction {
  slug: string;
  name: string;
  accent: string;
  logo?: string | null;
  blurb?: string | null;
}

/** Facciones registradas (con su ícono) para pintar filtros del catálogo y home. */
export async function getFactions(): Promise<CatalogFaction[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("factions")
    .select("slug,name,accent,logo,blurb")
    .order("name", { ascending: true });
  if (error) {
    console.error("getFactions:", error.message);
    return [];
  }
  return data as unknown as CatalogFaction[];
}

export async function getAllProducts(): Promise<Product[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("products")
    .select(SELECT)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getAllProducts:", error.message);
    return [];
  }
  return (data as unknown as DbProduct[]).map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("products")
    .select(SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("getProductBySlug:", error.message);
    return undefined;
  }
  return data ? mapProduct(data as unknown as DbProduct) : undefined;
}

export async function getFeatured(): Promise<Product[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("products")
    .select(SELECT)
    .eq("featured", true);
  if (error) {
    console.error("getFeatured:", error.message);
    return [];
  }
  return (data as unknown as DbProduct[]).map(mapProduct);
}

export async function getComingSoon(): Promise<Product[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("products")
    .select(SELECT)
    .eq("status", "coming_soon")
    .order("release_date", { ascending: true });
  if (error) {
    console.error("getComingSoon:", error.message);
    return [];
  }
  return (data as unknown as DbProduct[]).map(mapProduct);
}

/** Productos de una categoría (en `category` o `category2`). */
export async function getByCategory(category: string): Promise<Product[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("products")
    .select(SELECT)
    .or(`category.eq."${category}",category2.eq."${category}"`)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getByCategory:", error.message);
    return [];
  }
  return (data as unknown as DbProduct[]).map(mapProduct);
}

export async function getRelated(product: Product, limit = 3): Promise<Product[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("products")
    .select(SELECT)
    .eq("faction", product.faction)
    .neq("id", product.id)
    .limit(limit);
  if (error) {
    console.error("getRelated:", error.message);
    return [];
  }
  return (data as unknown as DbProduct[]).map(mapProduct);
}

export async function getCombos(): Promise<Combo[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("combos")
    .select(COMBO_SELECT)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getCombos:", error.message);
    return [];
  }
  return (data as unknown as DbCombo[]).map(mapCombo);
}

export async function getComboBySlug(slug: string): Promise<Combo | undefined> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("combos")
    .select(COMBO_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("getComboBySlug:", error.message);
    return undefined;
  }
  return data ? mapCombo(data as unknown as DbCombo) : undefined;
}
