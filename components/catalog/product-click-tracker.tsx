"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * Registra una visita a la ficha del producto (1 por carga) llamando al RPC
 * `increment_product_clicks` (público/anónimo, security definer). Componente
 * hoja sin UI: se monta dentro de la página server de `/producto/[slug]`.
 */
export function ProductClickTracker({ productId }: { productId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return; // evita doble conteo en StrictMode (dev)
    fired.current = true;
    getSupabaseBrowser()
      .rpc("increment_product_clicks", { p_product_id: productId })
      .then(({ error }) => {
        if (error) console.error("increment_product_clicks:", error.message);
      });
  }, [productId]);
  return null;
}
