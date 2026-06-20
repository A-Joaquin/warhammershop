"use client";

/**
 * Store del panel admin (Supabase).
 *
 * Carga productos (con costos e imágenes), ventas, reservas y categorías desde
 * Supabase cuando hay sesión de admin, y aplica las mutaciones contra la base.
 * Las escrituras usan el cliente de navegador (con el JWT del admin), así la RLS
 * autoriza. Tras cada mutación recargamos para reflejar el estado autoritativo.
 *
 * Las firmas son las mismas que la versión mock (ahora async): las pantallas las
 * llaman sin `await` (cierran el diálogo al instante y la tabla se refresca al
 * volver de la base).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Product,
  Reservation,
  ReservationStatus,
  Sale,
  SaleChannel,
} from "../types";
import { slugify, prettifySlug } from "../utils";
import { getSupabaseBrowser } from "../supabase/client";
import { useAdminAuth } from "./admin-auth";

export interface FactionOption {
  slug: string;
  name: string;
  accent: string;
  logo?: string | null;
}

interface StoreState {
  products: Product[];
  sales: Sale[];
  reservations: Reservation[];
  categories: string[];
  factions: FactionOption[];
}

export interface ProductInput {
  name: string;
  slug: string;
  faction: string;
  line: string;
  sku: string;
  description: string;
  condition: Product["condition"];
  price: number;
  currency: string;
  status: Product["status"];
  releaseDate?: string;
  isPreorder?: boolean;
  stockQty: number;
  featured?: boolean;
  images: Product["images"];
  /** Ruta del logo a asignar a la facción (se guarda en la tabla `factions`). */
  factionLogo?: string;
  category?: string;
  category2?: string;
  purchasePrice?: number; // costo en BOB (sin impuesto)
  purchasePriceUsd?: number; // costo en USD (par de monedas)
  taxRate?: number;
}

export interface MarkSoldInput {
  soldPrice: number;
  channel: SaleChannel;
  /** 2ª categoría: se guarda en la venta y en el producto. */
  category2?: string;
  buyerNote?: string;
}

export interface AdminStats {
  available: number;
  reserved: number;
  comingSoon: number;
  soldTotal: number;
  soldThisMonthCount: number;
  soldThisMonthAmount: number; // ingresos del mes
  soldThisMonthProfit: number; // ganancia del mes (ingresos - costo)
  pendingReservations: number;
}

interface AdminStoreValue extends StoreState {
  ready: boolean;
  stats: AdminStats;
  getProduct: (id: string) => Product | undefined;
  createProduct: (input: ProductInput) => Promise<void>;
  updateProduct: (id: string, input: ProductInput) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  markSold: (productId: string, input: MarkSoldInput) => Promise<void>;
  setReservationStatus: (id: string, status: ReservationStatus) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

const AdminStoreContext = createContext<AdminStoreValue | null>(null);

/* ---------------- Filas de Supabase + mapeo al modelo del front ---------------- */

interface DbCost {
  purchase_price: number | string;
  purchase_price_usd: number | string | null;
  tax_rate: number | string;
}
interface DbImage {
  url: string;
  kind: Product["images"][number]["kind"];
  alt_text: string | null;
  sort_order: number | null;
}
interface DbProductRow {
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
  product_costs: DbCost | DbCost[] | null;
  product_images: DbImage[] | null;
}
interface DbSaleRow {
  id: string;
  product_id: string | null;
  product_name: string;
  sku: string;
  sold_price: number | string;
  cost: number | string;
  cost_usd: number | string | null;
  fx_rate: number | string | null;
  currency: string;
  channel: SaleChannel;
  category: string | null;
  category2: string | null;
  buyer_note: string | null;
  sold_at: string;
}
interface DbReservationRow {
  id: string;
  product_id: string | null;
  product_name: string;
  customer_name: string;
  whatsapp: string;
  email: string | null;
  note: string | null;
  status: ReservationStatus;
  created_at: string;
}

const num = (v: number | string | null | undefined) =>
  v == null ? undefined : Number(v);

function mapProduct(r: DbProductRow): Product {
  const c = Array.isArray(r.product_costs) ? r.product_costs[0] : r.product_costs;
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
    purchasePrice: c ? Number(c.purchase_price) : undefined,
    purchasePriceUsd: c ? num(c.purchase_price_usd) : undefined,
    taxRate: c ? Number(c.tax_rate) : undefined,
  };
}

function mapSale(r: DbSaleRow): Sale {
  return {
    id: r.id,
    productId: r.product_id ?? "",
    productName: r.product_name,
    sku: r.sku,
    soldPrice: Number(r.sold_price),
    cost: Number(r.cost),
    costUsd: num(r.cost_usd),
    fxRate: num(r.fx_rate),
    currency: r.currency,
    soldAt: r.sold_at,
    channel: r.channel,
    category: r.category ?? undefined,
    category2: r.category2 ?? undefined,
    buyerNote: r.buyer_note ?? undefined,
  };
}

function mapReservation(r: DbReservationRow): Reservation {
  return {
    id: r.id,
    productId: r.product_id ?? "",
    productName: r.product_name,
    customerName: r.customer_name,
    whatsapp: r.whatsapp,
    email: r.email ?? undefined,
    note: r.note ?? undefined,
    status: r.status,
    createdAt: r.created_at,
  };
}

/** Fila de `products` lista para insert/update a partir del formulario. */
function productRow(input: ProductInput) {
  return {
    slug: input.slug || slugify(input.name),
    name: input.name,
    faction: input.faction,
    line: input.line || null,
    sku: input.sku,
    description: input.description || null,
    condition: input.condition,
    price: input.price,
    currency: input.currency,
    status: input.status,
    release_date:
      input.status === "coming_soon" ? input.releaseDate || null : null,
    is_preorder: input.isPreorder ?? false,
    stock_qty: input.stockQty,
    featured: input.featured ?? false,
    category: input.category?.trim() || null,
    category2: input.category2?.trim() || null,
  };
}

function sameMonth(iso: string, ref: Date) {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
  );
}

const SELECT_PRODUCT =
  "*, product_costs(purchase_price,purchase_price_usd,tax_rate), product_images(url,kind,alt_text,sort_order)";

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const sb = getSupabaseBrowser();
  const { authed } = useAdminAuth();
  const [state, setState] = useState<StoreState>({
    products: [],
    sales: [],
    reservations: [],
    categories: [],
    factions: [],
  });
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const [p, s, r, c, f] = await Promise.all([
      sb.from("products").select(SELECT_PRODUCT).order("created_at", { ascending: false }),
      sb.from("sales").select("*").order("sold_at", { ascending: false }),
      sb.from("reservations").select("*").order("created_at", { ascending: false }),
      sb.from("categories").select("name").order("name", { ascending: true }),
      sb.from("factions").select("slug,name,accent,logo").order("name", { ascending: true }),
    ]);
    if (p.error) console.error("load products:", p.error.message);
    if (s.error) console.error("load sales:", s.error.message);
    if (r.error) console.error("load reservations:", r.error.message);
    if (c.error) console.error("load categories:", c.error.message);
    if (f.error) console.error("load factions:", f.error.message);
    setState({
      products: ((p.data ?? []) as unknown as DbProductRow[]).map(mapProduct),
      sales: ((s.data ?? []) as unknown as DbSaleRow[]).map(mapSale),
      reservations: ((r.data ?? []) as unknown as DbReservationRow[]).map(mapReservation),
      categories: ((c.data ?? []) as unknown as { name: string }[]).map((x) => x.name),
      factions: ((f.data ?? []) as unknown as FactionOption[]),
    });
    setReady(true);
  }, [sb]);

  // Cargar cuando hay sesión de admin.
  useEffect(() => {
    if (authed) reload();
  }, [authed, reload]);

  const ensureCategories = useCallback(
    async (...names: (string | undefined)[]) => {
      const rows = names
        .map((n) => n?.trim())
        .filter((n): n is string => Boolean(n))
        .map((name) => ({ name }));
      if (rows.length) {
        await sb
          .from("categories")
          .upsert(rows, { onConflict: "name", ignoreDuplicates: true });
      }
    },
    [sb]
  );

  // Crea la facción/marca si no existe (FK de products.faction). Las existentes
  // conservan su nombre/acento (ignoreDuplicates); las nuevas usan un acento por
  // defecto y un nombre legible derivado del slug. Si se pasa `logo`, se guarda
  // (o se limpia con cadena vacía) en la facción — sirve para mostrar su ícono
  // en el catálogo, incluso en facciones nuevas.
  const ensureFaction = useCallback(
    async (slug?: string, logo?: string) => {
      const s = slug?.trim();
      if (!s) return;
      await sb
        .from("factions")
        .upsert(
          { slug: s, name: prettifySlug(s), accent: "#46535b" },
          { onConflict: "slug", ignoreDuplicates: true }
        );
      if (logo !== undefined) {
        await sb
          .from("factions")
          .update({ logo: logo.trim() || null })
          .eq("slug", s);
      }
    },
    [sb]
  );

  const getProduct = useCallback(
    (id: string) => state.products.find((p) => p.id === id),
    [state.products]
  );

  const createProduct = useCallback<AdminStoreValue["createProduct"]>(
    async (input) => {
      // La facción debe existir antes de insertar (FK).
      await ensureFaction(input.faction, input.factionLogo);
      const { data, error } = await sb
        .from("products")
        .insert(productRow(input))
        .select("id")
        .single<{ id: string }>();
      if (error || !data) {
        console.error("createProduct:", error?.message);
        return;
      }
      const id = data.id;
      await sb.from("product_costs").insert({
        product_id: id,
        purchase_price: input.purchasePrice ?? 0,
        purchase_price_usd: input.purchasePriceUsd ?? null,
        tax_rate: input.taxRate ?? 0,
      });
      if (input.images.length) {
        await sb.from("product_images").insert(
          input.images.map((im, i) => ({
            product_id: id,
            url: im.url,
            kind: im.kind,
            alt_text: im.alt,
            sort_order: i,
          }))
        );
      }
      await ensureCategories(input.category, input.category2);
      await reload();
    },
    [sb, ensureFaction, ensureCategories, reload]
  );

  const updateProduct = useCallback<AdminStoreValue["updateProduct"]>(
    async (id, input) => {
      await ensureFaction(input.faction, input.factionLogo);
      const { error } = await sb.from("products").update(productRow(input)).eq("id", id);
      if (error) {
        console.error("updateProduct:", error.message);
        return;
      }
      await sb.from("product_costs").upsert({
        product_id: id,
        purchase_price: input.purchasePrice ?? 0,
        purchase_price_usd: input.purchasePriceUsd ?? null,
        tax_rate: input.taxRate ?? 0,
      });
      // Reemplaza el set de imágenes (borra y reinserta en orden).
      await sb.from("product_images").delete().eq("product_id", id);
      if (input.images.length) {
        await sb.from("product_images").insert(
          input.images.map((im, i) => ({
            product_id: id,
            url: im.url,
            kind: im.kind,
            alt_text: im.alt,
            sort_order: i,
          }))
        );
      }
      await ensureCategories(input.category, input.category2);
      await reload();
    },
    [sb, ensureFaction, ensureCategories, reload]
  );

  const deleteProduct = useCallback<AdminStoreValue["deleteProduct"]>(
    async (id) => {
      const { error } = await sb.from("products").delete().eq("id", id);
      if (error) console.error("deleteProduct:", error.message);
      await reload();
    },
    [sb, reload]
  );

  const markSold = useCallback<AdminStoreValue["markSold"]>(
    async (productId, input) => {
      const { error } = await sb.rpc("mark_product_sold", {
        p_product_id: productId,
        p_sold_price: input.soldPrice,
        p_channel: input.channel,
        p_category2: input.category2?.trim() || null,
        p_buyer_note: input.buyerNote || null,
      });
      if (error) console.error("markSold:", error.message);
      await ensureCategories(input.category2);
      await reload();
    },
    [sb, ensureCategories, reload]
  );

  const setReservationStatus = useCallback<AdminStoreValue["setReservationStatus"]>(
    async (id, status) => {
      const { error } = await sb.from("reservations").update({ status }).eq("id", id);
      if (error) console.error("setReservationStatus:", error.message);
      await reload();
    },
    [sb, reload]
  );

  const deleteReservation = useCallback<AdminStoreValue["deleteReservation"]>(
    async (id) => {
      const { error } = await sb.from("reservations").delete().eq("id", id);
      if (error) console.error("deleteReservation:", error.message);
      await reload();
    },
    [sb, reload]
  );

  const stats = useMemo<AdminStats>(() => {
    const now = new Date();
    const monthSales = state.sales.filter((sl) => sameMonth(sl.soldAt, now));
    return {
      available: state.products.filter((p) => p.status === "available").length,
      reserved: state.products.filter((p) => p.status === "reserved").length,
      comingSoon: state.products.filter((p) => p.status === "coming_soon").length,
      soldTotal: state.products.filter((p) => p.status === "sold").length,
      soldThisMonthCount: monthSales.length,
      soldThisMonthAmount: monthSales.reduce((a, s) => a + s.soldPrice, 0),
      soldThisMonthProfit: monthSales.reduce((a, s) => a + (s.soldPrice - s.cost), 0),
      pendingReservations: state.reservations.filter((r) => r.status === "pendiente").length,
    };
  }, [state]);

  const value = useMemo<AdminStoreValue>(
    () => ({
      ...state,
      ready,
      stats,
      getProduct,
      createProduct,
      updateProduct,
      deleteProduct,
      markSold,
      setReservationStatus,
      deleteReservation,
      reload,
    }),
    [
      state,
      ready,
      stats,
      getProduct,
      createProduct,
      updateProduct,
      deleteProduct,
      markSold,
      setReservationStatus,
      deleteReservation,
      reload,
    ]
  );

  return (
    <AdminStoreContext.Provider value={value}>
      {children}
    </AdminStoreContext.Provider>
  );
}

export function useAdminStore() {
  const ctx = useContext(AdminStoreContext);
  if (!ctx)
    throw new Error("useAdminStore debe usarse dentro de <AdminStoreProvider>");
  return ctx;
}
