"use client";

import { cn } from "@/lib/utils";
import type { ReservationStatus, SaleChannel } from "@/lib/types";

/** Cabecera de página del admin. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-[0.08em] text-bone md:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-bone/40">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Panel/tarjeta base. */
export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border border-char bg-ink-2", className)}>{children}</div>
  );
}

export const SALE_CHANNEL_LABEL: Record<SaleChannel, string> = {
  whatsapp: "WhatsApp",
  en_tienda: "En tienda",
  otro: "Otro",
};

const RESERVATION_STATUS_MAP: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  pendiente: { label: "Pendiente", className: "text-gold border-gold/40 bg-gold/10" },
  confirmada: {
    label: "Confirmada",
    className: "text-sky-300 border-sky-400/40 bg-sky-400/10",
  },
  cumplida: {
    label: "Cumplida",
    className: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10",
  },
  cancelada: {
    label: "Cancelada",
    className: "text-bone/45 border-bone/20 bg-bone/5",
  },
};

export function ReservationStatusBadge({
  status,
}: {
  status: ReservationStatus;
}) {
  const s = RESERVATION_STATUS_MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
        s.className
      )}
    >
      {s.label}
    </span>
  );
}

export const RESERVATION_STATUSES: ReservationStatus[] = [
  "pendiente",
  "confirmada",
  "cumplida",
  "cancelada",
];
