"use client";

import { useState } from "react";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { useAccount } from "@/lib/contexts/account-context";
import { LEGIONS } from "@/lib/data/legions";
import { DEPARTMENTS } from "@/lib/data/departments";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LegionBadge } from "@/components/account/legion-badge";

type Tab = "login" | "register";

// Ingreso con Google: oculto por ahora. Ponlo en `true` cuando actives el
// proveedor en Supabase (Auth → Providers → Google) para mostrar el botón.
const SHOW_GOOGLE = false;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.5 34.5 26.9 35.5 24 35.5c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.5 5.5C41.4 36.3 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

export function AuthPanel() {
  const { signUp, signIn, signInWithGoogle } = useAccount();
  const [tab, setTab] = useState<Tab>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [legion, setLegion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setError(null);
    setMessage(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    reset();
    const res =
      tab === "register"
        ? await signUp({ name, email, password, phone, department, legion })
        : await signIn({ email, password });
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Algo salió mal.");
    else if (res.message) setMessage(res.message);
  };

  const onGoogle = async () => {
    if (busy) return;
    setBusy(true);
    reset();
    const res = await signInWithGoogle();
    if (!res.ok) {
      setBusy(false);
      setError(res.error ?? "No se pudo continuar con Google.");
    }
    // si ok, el navegador redirige a Google
  };

  const loyalists = LEGIONS.filter((l) => l.allegiance === "loyalist");
  const traitors = LEGIONS.filter((l) => l.allegiance === "traitor");

  return (
    <div className="mx-auto w-full max-w-xl border border-char bg-ink-2 p-6 md:p-8">
      {/* Tabs */}
      <div className="mb-6 grid grid-cols-2 border border-char">
        {(["login", "register"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              reset();
            }}
            className={cn(
              "py-3 font-display text-sm font-semibold uppercase tracking-[0.12em] transition-colors",
              tab === t ? "bg-ember text-ink" : "text-bone/60 hover:text-bone"
            )}
          >
            {t === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {tab === "register" && (
          <Field label="Nombre">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                reset();
              }}
              placeholder="Tu nombre"
            />
          </Field>
        )}

        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              reset();
            }}
            placeholder="tucorreo@ejemplo.com"
          />
        </Field>

        <Field label="Contraseña">
          <Input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              reset();
            }}
            placeholder={tab === "register" ? "Mínimo 6 caracteres" : "Tu contraseña"}
          />
        </Field>

        {tab === "register" && (
          <Field label="Teléfono (WhatsApp)">
            <Input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                reset();
              }}
              placeholder="Ej. 70123456"
            />
          </Field>
        )}

        {tab === "register" && (
          <Field label="Departamento">
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                reset();
              }}
              className="h-11 w-full border border-char bg-ink px-3 font-mono text-sm text-bone outline-none transition-colors focus:border-ember"
            >
              <option value="">Elige tu departamento</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        )}

        {tab === "register" && (
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/45">
              Elige tu legión
            </span>
            <LegionGroup
              title="Leales"
              legions={loyalists}
              selected={legion}
              onSelect={(id) => {
                setLegion(id);
                reset();
              }}
            />
            <LegionGroup
              title="Traidoras"
              legions={traitors}
              selected={legion}
              onSelect={(id) => {
                setLegion(id);
                reset();
              }}
            />
          </div>
        )}

        {error && (
          <p className="flex items-center gap-1.5 font-mono text-[11px] text-red-400">
            <ShieldAlert className="h-3.5 w-3.5" /> {error}
          </p>
        )}
        {message && (
          <p className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> {message}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={busy}>
          {busy
            ? "Procesando…"
            : tab === "register"
              ? "Crear mi cuenta"
              : "Ingresar"}
        </Button>
      </form>

      {/* Ingreso con Google — oculto por ahora (ver SHOW_GOOGLE arriba) */}
      {SHOW_GOOGLE && (
        <>
          {/* Separador */}
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-char" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/35">
              o
            </span>
            <span className="h-px flex-1 bg-char" />
          </div>

          <button
            type="button"
            onClick={onGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-3 border border-char bg-bone px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:bg-white disabled:opacity-60"
          >
            <GoogleIcon className="h-5 w-5" />
            Continuar con Google
          </button>
          <p className="mt-3 text-center font-mono text-[9px] leading-relaxed tracking-[0.08em] text-bone/30">
            Si entras con Google, completa tu teléfono y departamento en tu perfil.
          </p>
        </>
      )}
    </div>
  );
}

function LegionGroup({
  title,
  legions,
  selected,
  onSelect,
}: {
  title: string;
  legions: typeof LEGIONS;
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-bone/35">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {legions.map((l) => {
          const active = selected === l.id;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onSelect(l.id)}
              className={cn(
                "flex items-center gap-2 border px-2 py-1.5 text-left transition-colors",
                active
                  ? "border-ember bg-ember/10"
                  : "border-char hover:border-steel"
              )}
            >
              <LegionBadge legion={l} size="sm" />
              <span
                className={cn(
                  "truncate font-mono text-[10px] uppercase tracking-[0.08em]",
                  active ? "text-bone" : "text-bone/60"
                )}
              >
                {l.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/45">
        {label}
      </span>
      {children}
    </label>
  );
}
