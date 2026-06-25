"use client";

/**
 * Cuentas de cliente con **Supabase Auth** (real).
 *
 * Registro/login con email+contraseña y "Continuar con Google" (OAuth real, si el
 * proveedor está activado en Supabase). Cada cliente guarda su **nombre**,
 * **teléfono**, **departamento** y **legión** en la tabla `profiles` (la crea el
 * trigger `handle_new_user` a partir de la metadata del signUp). La sesión la
 * maneja `supabase-js` (token en localStorage, refresco automático); la RLS
 * (`auth.uid()`) protege que cada quien solo lea/edite su propio perfil.
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
import { LEGIONS } from "../data/legions";
import { isDepartment } from "../data/departments";

export type AuthProvider = "email" | "google";

export interface Account {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  legion: string; // id de legión
  provider: AuthProvider;
  createdAt: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  /** Mensaje informativo (p. ej. "revisa tu correo para confirmar"). */
  message?: string;
}

interface AccountContextValue {
  ready: boolean;
  user: Account | null;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    phone: string;
    department: string;
    legion: string;
  }) => Promise<AuthResult>;
  signIn: (input: { email: string; password: string }) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  /** Actualiza campos editables del perfil (legión, teléfono, departamento). */
  updateProfile: (
    patch: Partial<Pick<Account, "legion" | "phone" | "department" | "name">>
  ) => Promise<AuthResult>;
  /** Atajo para cambiar solo la legión. */
  updateLegion: (legionId: string) => Promise<AuthResult>;
}

const AccountContext = createContext<AccountContextValue | null>(null);

/** Fila cruda de `profiles` (lo que devuelve Supabase). */
interface ProfileRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  department: string | null;
  legion: string | null;
  provider: string | null;
  created_at: string | null;
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const sb = getSupabaseBrowser();
  const [user, setUser] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);

  /** Lee el perfil del usuario logueado y lo mapea a `Account`. */
  const loadProfile = useCallback(
    async (userId: string, fallbackEmail: string | null): Promise<Account | null> => {
      const { data } = await sb
        .from("profiles")
        .select("id, name, email, phone, department, legion, provider, created_at")
        .eq("id", userId)
        .maybeSingle<ProfileRow>();

      if (!data) {
        // Sesión sin perfil (caso raro: trigger aún no corrió). Devuelve lo mínimo.
        return fallbackEmail
          ? {
              id: userId,
              name: fallbackEmail.split("@")[0],
              email: fallbackEmail,
              phone: "",
              department: "",
              legion: "",
              provider: "email",
              createdAt: new Date().toISOString(),
            }
          : null;
      }

      return {
        id: data.id,
        name: data.name ?? (data.email ?? "").split("@")[0],
        email: data.email ?? fallbackEmail ?? "",
        phone: data.phone ?? "",
        department: data.department ?? "",
        legion: data.legion ?? "",
        provider: data.provider === "google" ? "google" : "email",
        createdAt: data.created_at ?? new Date().toISOString(),
      };
    },
    [sb]
  );

  // Restaurar sesión y escuchar cambios de auth.
  useEffect(() => {
    let active = true;

    sb.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (session && active) {
        setUser(await loadProfile(session.user.id, session.user.email ?? null));
      }
      if (active) setReady(true);
    });

    const { data: sub } = sb.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (session) {
        setUser(await loadProfile(session.user.id, session.user.email ?? null));
      } else {
        setUser(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [sb, loadProfile]);

  const signUp = useCallback<AccountContextValue["signUp"]>(
    async ({ name, email, password, phone, department, legion }) => {
      const cleanEmail = email.trim().toLowerCase();
      if (!name.trim()) return { ok: false, error: "Pon tu nombre." };
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail))
        return { ok: false, error: "Email no válido." };
      if (password.length < 6)
        return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
      if (!phone.trim()) return { ok: false, error: "Pon tu número de teléfono." };
      if (!isDepartment(department))
        return { ok: false, error: "Elige tu departamento." };
      if (!LEGIONS.some((l) => l.id === legion))
        return { ok: false, error: "Elige tu legión." };

      const { data, error } = await sb.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: name.trim(),
            phone: phone.trim(),
            department,
            legion,
            provider: "email",
          },
        },
      });

      if (error) {
        if (process.env.NODE_ENV !== "production")
          console.error("signUp error:", error);
        const msg = error.message ?? "";
        if (/already registered|already exists|user.*exists/i.test(msg))
          return { ok: false, error: "Ya existe una cuenta con ese email." };
        if (/signups? not allowed|signup is disabled/i.test(msg))
          return { ok: false, error: "El registro está deshabilitado en el servidor." };
        if (/password/i.test(msg))
          return { ok: false, error: "La contraseña no cumple los requisitos del servidor." };
        // Otros casos: muestra el mensaje real para diagnosticar.
        return { ok: false, error: `No se pudo crear la cuenta: ${msg}` };
      }

      // Si la confirmación por correo está activada, no hay sesión todavía.
      if (!data.session) {
        return {
          ok: true,
          message: "Te enviamos un correo para confirmar tu cuenta.",
        };
      }

      setUser(await loadProfile(data.user!.id, data.user!.email ?? null));
      return { ok: true };
    },
    [sb, loadProfile]
  );

  const signIn = useCallback<AccountContextValue["signIn"]>(
    async ({ email, password }) => {
      const { data, error } = await sb.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error || !data.user) {
        return { ok: false, error: "Email o contraseña incorrectos." };
      }
      setUser(await loadProfile(data.user.id, data.user.email ?? null));
      return { ok: true };
    },
    [sb, loadProfile]
  );

  /** OAuth real de Google (requiere el proveedor activado en Supabase). */
  const signInWithGoogle = useCallback<AccountContextValue["signInWithGoogle"]>(async () => {
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/cuenta` : undefined,
      },
    });
    if (error) return { ok: false, error: "No se pudo continuar con Google." };
    return { ok: true }; // el navegador redirige a Google
  }, [sb]);

  const signOut = useCallback(async () => {
    await sb.auth.signOut();
    setUser(null);
  }, [sb]);

  const updateProfile = useCallback<AccountContextValue["updateProfile"]>(
    async (patch) => {
      if (!user) return { ok: false, error: "No has iniciado sesión." };
      if (patch.legion !== undefined && !LEGIONS.some((l) => l.id === patch.legion))
        return { ok: false, error: "Legión no válida." };
      if (patch.department !== undefined && !isDepartment(patch.department))
        return { ok: false, error: "Departamento no válido." };

      const { error } = await sb
        .from("profiles")
        .update(patch)
        .eq("id", user.id);
      if (error) return { ok: false, error: "No se pudo guardar el cambio." };

      setUser({ ...user, ...patch });
      return { ok: true };
    },
    [sb, user]
  );

  const updateLegion = useCallback<AccountContextValue["updateLegion"]>(
    (legionId) => updateProfile({ legion: legionId }),
    [updateProfile]
  );

  const value = useMemo<AccountContextValue>(
    () => ({
      ready,
      user,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      updateProfile,
      updateLegion,
    }),
    [ready, user, signUp, signIn, signInWithGoogle, signOut, updateProfile, updateLegion]
  );

  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx)
    throw new Error("useAccount debe usarse dentro de <AccountProvider>");
  return ctx;
}
