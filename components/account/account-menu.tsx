"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, User, ChevronDown } from "lucide-react";
import { useAccount } from "@/lib/contexts/account-context";
import { getLegion } from "@/lib/data/legions";
import { cn } from "@/lib/utils";
import { LegionBadge } from "@/components/account/legion-badge";

export function AccountMenu() {
  const { ready, user, signOut } = useAccount();
  const [open, setOpen] = useState(false);

  // Sin sesión (o aún cargando): enlace a /cuenta.
  if (!ready || !user) {
    return (
      <Link
        href="/cuenta"
        className="hidden sm:inline-flex items-center gap-2 border border-steel/70 px-4 py-2 font-mono text-[11px] tracking-[0.18em] uppercase text-bone transition-colors hover:border-ember hover:text-ember"
      >
        <User className="h-3.5 w-3.5" />
        Ingresar
      </Link>
    );
  }

  const legion = getLegion(user.legion);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Mi cuenta"
        aria-expanded={open}
        className="inline-flex items-center gap-2 border border-char px-2 py-1.5 transition-colors hover:border-ember"
      >
        <LegionBadge legion={legion} size="sm" />
        <span className="hidden max-w-[120px] truncate font-mono text-[11px] uppercase tracking-[0.12em] text-bone sm:inline">
          {user.name}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-bone/50 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-60 border border-char bg-ink-2 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-char p-4">
              <LegionBadge legion={legion} size="md" />
              <div className="min-w-0">
                <p className="truncate font-display text-sm uppercase tracking-wide text-bone">
                  {user.name}
                </p>
                <p className="truncate font-mono text-[10px] tracking-[0.08em] text-bone/40">
                  {legion?.name ?? "Sin legión"}
                </p>
              </div>
            </div>
            <Link
              href="/cuenta"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-bone/70 transition-colors hover:bg-bone/5 hover:text-bone"
            >
              <User className="h-4 w-4" /> Mi cuenta
            </Link>
            <button
              type="button"
              onClick={() => {
                signOut();
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 border-t border-char px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-bone/70 transition-colors hover:bg-bone/5 hover:text-ember"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}
