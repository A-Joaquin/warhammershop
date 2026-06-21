import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Cliente Supabase del NAVEGADOR (singleton). Mantiene la sesión del usuario en
 * localStorage y refresca el token solo. Lo usan los componentes de cliente
 * (panel admin, cuentas) para leer/escribir con el JWT del usuario, de modo que
 * la RLS (`is_admin()`, `auth.uid()`) autoriza las operaciones del lado servidor.
 */
let _client: ReturnType<typeof createClient<Database>> | undefined;

export function getSupabaseBrowser() {
  if (!_client) _client = createClient<Database>(url, anonKey);
  return _client;
}
