"use client";

/**
 * Carrito de compra (lado cliente).
 *
 * El negocio NO cobra online: el carrito junta varias piezas y al "finalizar"
 * abre un único mensaje de WhatsApp con todo el pedido (ver `waCartLink` en
 * `lib/whatsapp.ts`). El estado se persiste en localStorage para que el cliente
 * no pierda su selección al navegar o recargar.
 *
 * Cuando llegue el backend (Supabase), el carrito sigue siendo de cliente: solo
 * habría que validar stock/estado contra la base antes de generar el pedido.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product } from "../types";

const STORAGE_KEY = "arsenal-cart";

export interface CartItem {
  slug: string;
  name: string;
  sku: string;
  faction: string;
  price: number;
  currency: string;
  image: string;
  stockQty: number;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  /** Suma de unidades (para el badge). */
  count: number;
  /** Total en la moneda del catálogo. */
  total: number;
  isOpen: boolean;
  /** Devuelve true si la pieza es comprable y se añadió/incrementó. */
  add: (product: Product, qty?: number) => boolean;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  has: (slug: string) => boolean;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Solo las piezas disponibles entran al carrito (no reservadas/vendidas/próximas). */
function isPurchasable(product: Product) {
  return product.status === "available" && product.stockQty > 0;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Cargar desde localStorage una sola vez (evita desajuste de hidratación).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {
      /* almacenamiento corrupto o no disponible: empezar vacío */
    }
    setHydrated(true);
  }, []);

  // Guardar en cada cambio (solo después de la carga inicial).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* sin persistencia disponible */
    }
  }, [items, hydrated]);

  const add = useCallback((product: Product, qty = 1) => {
    if (!isPurchasable(product)) return false;
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === product.slug);
      if (existing) {
        const next = Math.min(existing.qty + qty, product.stockQty);
        return prev.map((i) =>
          i.slug === product.slug ? { ...i, qty: next } : i
        );
      }
      const item: CartItem = {
        slug: product.slug,
        name: product.name,
        sku: product.sku,
        faction: product.faction,
        price: product.price,
        currency: product.currency,
        image: product.images[0]?.url ?? "",
        stockQty: product.stockQty,
        qty: Math.min(qty, product.stockQty),
      };
      return [...prev, item];
    });
    return true;
  }, []);

  const remove = useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }, []);

  const setQty = useCallback((slug: string, qty: number) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.slug !== slug) return [i];
        const next = Math.min(Math.max(qty, 0), i.stockQty);
        return next <= 0 ? [] : [{ ...i, qty: next }];
      })
    );
  }, []);

  const has = useCallback(
    (slug: string) => items.some((i) => i.slug === slug),
    [items]
  );

  const clear = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.qty, 0),
    [items]
  );
  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count,
      total,
      isOpen,
      add,
      remove,
      setQty,
      has,
      clear,
      openCart,
      closeCart,
    }),
    [items, count, total, isOpen, add, remove, setQty, has, clear, openCart, closeCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
