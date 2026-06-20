"use client";

/**
 * Autenticación del admin con Supabase Auth.
 *
 * Inicia sesión con email+contraseña y solo deja entrar si el perfil tiene
 * `role = 'admin'` (tabla `profiles`). La seguridad real la da la RLS: aunque
 * alguien forzara la UI, no podría escribir sin una sesión de admin. Para
 * hacerte admin, tras registrarte ejecuta en Supabase:
 *   update public.profiles set role = 'admin' where email = 'TU-CORREO';
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSupabaseBrowser } from "../supabase/client";

interface AdminAuthValue {
  ready: boolean;
  authed: boolean; // sesión activa Y rol admin
  email: string | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const sb = getSupabaseBrowser();
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const isAdmin = useCallback(
    async (userId: string) => {
      const { data } = await sb
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle<{ role: string }>();
      return data?.role === "admin";
    },
    [sb]
  );

  // Restaurar sesión y escuchar cambios de auth.
  useEffect(() => {
    let active = true;
    sb.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (session && active) {
        setAuthed(await isAdmin(session.user.id));
        setEmail(session.user.email ?? null);
      }
      if (active) setReady(true);
    });

    const { data: sub } = sb.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (session) {
        setAuthed(await isAdmin(session.user.id));
        setEmail(session.user.email ?? null);
      } else {
        setAuthed(false);
        setEmail(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [sb, isAdmin]);

  const login = useCallback<AdminAuthValue["login"]>(
    async (emailInput, password) => {
      const { data, error } = await sb.auth.signInWithPassword({
        email: emailInput.trim().toLowerCase(),
        password,
      });
      if (error || !data.user) {
        return { ok: false, error: "Email o contraseña incorrectos." };
      }
      if (!(await isAdmin(data.user.id))) {
        await sb.auth.signOut();
        return { ok: false, error: "Esta cuenta no tiene acceso de administrador." };
      }
      setAuthed(true);
      setEmail(data.user.email ?? null);
      return { ok: true };
    },
    [sb, isAdmin]
  );

  const logout = useCallback(async () => {
    await sb.auth.signOut();
    setAuthed(false);
    setEmail(null);
  }, [sb]);

  const value = useMemo<AdminAuthValue>(
    () => ({ ready, authed, email, login, logout }),
    [ready, authed, email, login, logout]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx)
    throw new Error("useAdminAuth debe usarse dentro de <AdminAuthProvider>");
  return ctx;
}
