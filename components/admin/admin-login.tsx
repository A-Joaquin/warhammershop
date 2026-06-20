"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, ShieldAlert } from "lucide-react";
import { useAdminAuth } from "@/lib/contexts/admin-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Compuerta de acceso al panel (Supabase Auth + rol admin). */
export function AdminLogin() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await login(email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "No se pudo iniciar sesión.");
      setPassword("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <div className="w-full max-w-sm border border-char bg-ink-2 p-8">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center border border-ember/50 text-ember">
            <Lock className="h-5 w-5" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold uppercase tracking-[0.1em] text-bone">
            Panel del Arsenal
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-bone/40">
            Acceso solo staff
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-3">
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            placeholder="Correo"
            aria-label="Correo"
            autoComplete="email"
            autoFocus
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            placeholder="Contraseña"
            aria-label="Contraseña"
            autoComplete="current-password"
          />
          {error && (
            <p className="flex items-center gap-1.5 font-mono text-[11px] text-red-400">
              <ShieldAlert className="h-3.5 w-3.5" /> {error}
            </p>
          )}
          <Button type="submit" className="mt-1 w-full" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </Button>
        </form>

        <p className="mt-5 text-center font-mono text-[10px] leading-relaxed tracking-[0.08em] text-bone/30">
          Acceso solo para cuentas con rol <span className="text-bone/55">admin</span>.
        </p>

        <Link
          href="/"
          className="mt-4 block text-center font-mono text-[11px] uppercase tracking-[0.18em] text-bone/40 transition-colors hover:text-ember"
        >
          ← Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
