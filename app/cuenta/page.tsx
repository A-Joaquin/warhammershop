"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, LogOut, Mail, Pencil, Phone, MapPin } from "lucide-react";
import { useAccount } from "@/lib/contexts/account-context";
import { getLegion, LEGIONS } from "@/lib/data/legions";
import { DEPARTMENTS } from "@/lib/data/departments";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LegionBadge } from "@/components/account/legion-badge";
import { AuthPanel } from "@/components/account/auth-panel";

export default function CuentaPage() {
  const { ready, user, signOut, updateLegion, updateProfile } = useAccount();
  const [editLegion, setEditLegion] = useState(false);

  return (
    <section className="mx-auto min-h-[70vh] max-w-[1100px] px-6 pb-24 pt-28 md:px-12 md:pt-32">
      {!ready ? (
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.2em] text-bone/40">
          Cargando…
        </p>
      ) : !user ? (
        <div>
          <header className="mb-8 text-center">
            <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-bone md:text-4xl">
              Únete al Arsenal
            </h1>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-bone/45">
              Crea tu cuenta y declara tu legión
            </p>
          </header>
          <AuthPanel />
        </div>
      ) : (
        <ProfileView
          user={user}
          editLegion={editLegion}
          setEditLegion={setEditLegion}
          updateLegion={updateLegion}
          updateProfile={updateProfile}
          signOut={signOut}
        />
      )}
    </section>
  );
}

function ProfileView({
  user,
  editLegion,
  setEditLegion,
  updateLegion,
  updateProfile,
  signOut,
}: {
  user: NonNullable<ReturnType<typeof useAccount>["user"]>;
  editLegion: boolean;
  setEditLegion: (v: boolean) => void;
  updateLegion: ReturnType<typeof useAccount>["updateLegion"];
  updateProfile: ReturnType<typeof useAccount>["updateProfile"];
  signOut: () => void | Promise<void>;
}) {
  const legion = getLegion(user.legion);
  const loyalists = LEGIONS.filter((l) => l.allegiance === "loyalist");
  const traitors = LEGIONS.filter((l) => l.allegiance === "traitor");

  return (
    <div>
      {/* Cabecera de perfil */}
      <div
        className="flex flex-col items-center gap-5 border border-char bg-ink-2 p-8 text-center sm:flex-row sm:text-left"
        style={{
          background: legion
            ? `linear-gradient(135deg, ${legion.accent}1a, transparent 60%)`
            : undefined,
        }}
      >
        <LegionBadge legion={legion} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-bone">
            {user.name}
          </h1>
          <p className="mt-1 flex items-center justify-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-bone/45 sm:justify-start">
            <Mail className="h-3.5 w-3.5" /> {user.email}
          </p>
          {legion && (
            <p className="mt-3 font-display text-lg uppercase tracking-wide" style={{ color: legion.accent }}>
              {legion.name}
            </p>
          )}
          {legion?.motto && (
            <p className="font-mono text-[11px] italic tracking-[0.06em] text-bone/40">
              “{legion.motto}”
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex items-center gap-2 border border-bone/30 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-bone/70 transition-colors hover:border-ember hover:text-ember"
        >
          <LogOut className="h-4 w-4" /> Salir
        </button>
      </div>

      {/* Datos de contacto */}
      <ContactCard user={user} updateProfile={updateProfile} />

      {/* Cambiar legión */}
      <div className="mt-6 border border-char bg-ink-2 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase tracking-[0.08em] text-bone">
            Tu legión
          </h2>
          <button
            type="button"
            onClick={() => setEditLegion(!editLegion)}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ember/80 hover:text-ember"
          >
            <Pencil className="h-3.5 w-3.5" /> {editLegion ? "Cerrar" : "Cambiar"}
          </button>
        </div>

        {editLegion ? (
          <div className="mt-4 flex flex-col gap-4">
            <LegionGrid title="Leales" legions={loyalists} selected={user.legion} onSelect={(id) => void updateLegion(id)} />
            <LegionGrid title="Traidoras" legions={traitors} selected={user.legion} onSelect={(id) => void updateLegion(id)} />
          </div>
        ) : (
          <p className="mt-3 font-mono text-[12px] tracking-[0.06em] text-bone/50">
            {legion
              ? `Combates bajo los colores de ${legion.name}. Pronto la tienda se adaptará a tu legión.`
              : "Aún no has elegido legión."}
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/tienda"
          className="inline-flex items-center justify-center bg-ember px-6 py-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-ink"
        >
          Ir al catálogo
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center border border-bone/30 px-6 py-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-bone transition-colors hover:border-bone"
        >
          Inicio
        </Link>
      </div>
    </div>
  );
}

function ContactCard({
  user,
  updateProfile,
}: {
  user: NonNullable<ReturnType<typeof useAccount>["user"]>;
  updateProfile: ReturnType<typeof useAccount>["updateProfile"];
}) {
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(user.phone);
  const [department, setDepartment] = useState(user.department);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    setBusy(true);
    setError(null);
    const res = await updateProfile({ phone: phone.trim(), department });
    setBusy(false);
    if (!res.ok) setError(res.error ?? "No se pudo guardar.");
    else setEditing(false);
  };

  return (
    <div className="mt-6 border border-char bg-ink-2 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold uppercase tracking-[0.08em] text-bone">
          Datos de contacto
        </h2>
        <button
          type="button"
          onClick={() => {
            setEditing((v) => !v);
            setPhone(user.phone);
            setDepartment(user.department);
            setError(null);
          }}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ember/80 hover:text-ember"
        >
          <Pencil className="h-3.5 w-3.5" /> {editing ? "Cerrar" : "Editar"}
        </button>
      </div>

      {editing ? (
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/45">
              Teléfono (WhatsApp)
            </span>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej. 70123456"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/45">
              Departamento
            </span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="h-11 w-full border border-char bg-ink px-3 font-mono text-sm text-bone outline-none transition-colors focus:border-ember"
            >
              <option value="">Elige tu departamento</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p className="font-mono text-[11px] text-red-400">{error}</p>
          )}
          <Button onClick={onSave} disabled={busy} className="self-start">
            {busy ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2 font-mono text-[12px] tracking-[0.06em] text-bone/60">
          <p className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-bone/40" />
            {user.phone || "Sin teléfono"}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-bone/40" />
            {user.department || "Sin departamento"}
          </p>
        </div>
      )}
    </div>
  );
}

function LegionGrid({
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
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
        {legions.map((l) => {
          const active = selected === l.id;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => onSelect(l.id)}
              className={cn(
                "flex items-center gap-2 border px-2 py-2 text-left transition-colors",
                active ? "border-ember bg-ember/10" : "border-char hover:border-steel"
              )}
            >
              <LegionBadge legion={l} size="sm" />
              <span className={cn("flex-1 truncate font-mono text-[10px] uppercase tracking-[0.06em]", active ? "text-bone" : "text-bone/60")}>
                {l.name}
              </span>
              {active && <Check className="h-3.5 w-3.5 shrink-0 text-ember" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
