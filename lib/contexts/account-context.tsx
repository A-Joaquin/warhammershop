"use client";

/**
 * Cuentas de cliente (MOCK, lado cliente).
 *
 * Permite registro/login con email+contraseña y un "Continuar con Google"
 * SIMULADO (el OAuth real llega con Supabase Auth). Cada cliente elige su
 * **legión** al registrarse y puede cambiarla luego. Todo se guarda en
 * localStorage.
 *
 * ⚠️ Esto NO es seguridad real: las credenciales viven en el navegador. Es solo
 * para construir la UI; al conectar Supabase Auth este provider se reemplaza por
 * la sesión real (email/password + proveedor Google) y los datos de perfil
 * (incl. la legión) pasan a una tabla `profiles`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LEGIONS } from "../data/legions";

const ACCOUNTS_KEY = "arsenal-accounts";
const PASSWORDS_KEY = "arsenal-passwords"; // mock: email -> password
const SESSION_KEY = "arsenal-session";

export type AuthProvider = "email" | "google";

export interface Account {
  id: string;
  name: string;
  email: string;
  legion: string; // id de legión
  provider: AuthProvider;
  createdAt: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AccountContextValue {
  ready: boolean;
  user: Account | null;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    legion: string;
  }) => AuthResult;
  signIn: (input: { email: string; password: string }) => AuthResult;
  signInWithGoogle: (legion?: string) => AuthResult;
  signOut: () => void;
  updateLegion: (legionId: string) => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sin storage */
  }
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [ready, setReady] = useState(false);

  // Restaurar sesión.
  useEffect(() => {
    const sessionId = read<string | null>(SESSION_KEY, null);
    if (sessionId) {
      const accounts = read<Account[]>(ACCOUNTS_KEY, []);
      const found = accounts.find((a) => a.id === sessionId) ?? null;
      setUser(found);
    }
    setReady(true);
  }, []);

  const persistSession = useCallback((account: Account | null) => {
    setUser(account);
    if (account) write(SESSION_KEY, account.id);
    else
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {
        /* noop */
      }
  }, []);

  const signUp = useCallback<AccountContextValue["signUp"]>(
    ({ name, email, password, legion }) => {
      const cleanEmail = email.trim().toLowerCase();
      if (!name.trim()) return { ok: false, error: "Pon tu nombre." };
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail))
        return { ok: false, error: "Email no válido." };
      if (password.length < 6)
        return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
      if (!LEGIONS.some((l) => l.id === legion))
        return { ok: false, error: "Elige tu legión." };

      const accounts = read<Account[]>(ACCOUNTS_KEY, []);
      if (accounts.some((a) => a.email === cleanEmail))
        return { ok: false, error: "Ya existe una cuenta con ese email." };

      const account: Account = {
        id: uid(),
        name: name.trim(),
        email: cleanEmail,
        legion,
        provider: "email",
        createdAt: new Date().toISOString(),
      };
      write(ACCOUNTS_KEY, [...accounts, account]);
      const passwords = read<Record<string, string>>(PASSWORDS_KEY, {});
      write(PASSWORDS_KEY, { ...passwords, [cleanEmail]: password });
      persistSession(account);
      return { ok: true };
    },
    [persistSession]
  );

  const signIn = useCallback<AccountContextValue["signIn"]>(
    ({ email, password }) => {
      const cleanEmail = email.trim().toLowerCase();
      const accounts = read<Account[]>(ACCOUNTS_KEY, []);
      const account = accounts.find((a) => a.email === cleanEmail);
      if (!account) return { ok: false, error: "No hay cuenta con ese email." };
      const passwords = read<Record<string, string>>(PASSWORDS_KEY, {});
      if (passwords[cleanEmail] !== password)
        return { ok: false, error: "Contraseña incorrecta." };
      persistSession(account);
      return { ok: true };
    },
    [persistSession]
  );

  /** Google SIMULADO: usa/crea una cuenta demo de Google. */
  const signInWithGoogle = useCallback<AccountContextValue["signInWithGoogle"]>(
    (legion) => {
      const demoEmail = "comandante@gmail.com";
      const accounts = read<Account[]>(ACCOUNTS_KEY, []);
      const existing = accounts.find((a) => a.email === demoEmail);
      if (existing) {
        persistSession(existing);
        return { ok: true };
      }
      const account: Account = {
        id: uid(),
        name: "Comandante (Google)",
        email: demoEmail,
        legion: legion && LEGIONS.some((l) => l.id === legion)
          ? legion
          : LEGIONS[0].id,
        provider: "google",
        createdAt: new Date().toISOString(),
      };
      write(ACCOUNTS_KEY, [...accounts, account]);
      persistSession(account);
      return { ok: true };
    },
    [persistSession]
  );

  const signOut = useCallback(() => persistSession(null), [persistSession]);

  const updateLegion = useCallback(
    (legionId: string) => {
      if (!user || !LEGIONS.some((l) => l.id === legionId)) return;
      const updated: Account = { ...user, legion: legionId };
      const accounts = read<Account[]>(ACCOUNTS_KEY, []);
      write(
        ACCOUNTS_KEY,
        accounts.map((a) => (a.id === updated.id ? updated : a))
      );
      setUser(updated);
    },
    [user]
  );

  const value = useMemo<AccountContextValue>(
    () => ({
      ready,
      user,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      updateLegion,
    }),
    [ready, user, signUp, signIn, signInWithGoogle, signOut, updateLegion]
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
