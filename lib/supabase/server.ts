import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Cliente Supabase para LECTURAS PÚBLICAS desde el servidor (Server Components).
 * Usa la anon key y no maneja sesión ni cookies → no fuerza render dinámico, así
 * la vitrina puede seguir siendo estática/ISR. La RLS permite el `select` público
 * de catálogo (products, product_images, factions, legions, categories).
 */
export function createPublicClient() {
  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local"
    );
  }
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
