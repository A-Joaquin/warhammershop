"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import type { ReservationStatus } from "@/lib/types";
import { useAdminStore } from "@/lib/contexts/admin-store";
import { formatDate, cn } from "@/lib/utils";
import { waLink } from "@/lib/whatsapp";
import {
  PageHeader,
  Panel,
  ReservationStatusBadge,
  RESERVATION_STATUSES,
} from "@/components/admin/admin-ui";

const FILTERS: { value: "" | ReservationStatus; label: string }[] = [
  { value: "", label: "Todas" },
  ...RESERVATION_STATUSES.map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  })),
];

export default function AdminReservationsPage() {
  const { reservations, setReservationStatus, deleteReservation } =
    useAdminStore();
  const [filter, setFilter] = useState<"" | ReservationStatus>("");

  const filtered = useMemo(
    () =>
      [...reservations]
        .filter((r) => !filter || r.status === filter)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reservations, filter]
  );

  return (
    <div>
      <PageHeader title="Reservas" subtitle="Gestión de próximos lanzamientos" />

      {/* Filtro por estado */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
              filter === f.value
                ? "border-ember bg-ember/10 text-ember"
                : "border-char text-bone/55 hover:border-steel"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Panel>
          <p className="px-5 py-16 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-bone/35">
            No hay reservas{filter ? " con ese estado" : ""}.
          </p>
        </Panel>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r) => (
            <Panel key={r.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-display text-base uppercase tracking-wide text-bone">
                      {r.customerName}
                    </p>
                    <ReservationStatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-bone/45">
                    Reserva: {r.productName}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] tracking-[0.1em] text-bone/35">
                    {formatDate(r.createdAt)}
                  </p>
                  {r.note && (
                    <p className="mt-2 max-w-prose text-sm italic text-bone/55">
                      “{r.note}”
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={waLink(
                      `Hola ${r.customerName}, te escribimos del Arsenal del Emperador por tu reserva de "${r.productName}".`,
                      r.whatsapp
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 border border-[#25D366]/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-bone transition-colors hover:bg-[#25D366] hover:text-ink"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> {r.whatsapp}
                  </a>

                  <label className="sr-only" htmlFor={`status-${r.id}`}>
                    Cambiar estado
                  </label>
                  <select
                    id={`status-${r.id}`}
                    value={r.status}
                    onChange={(e) =>
                      setReservationStatus(
                        r.id,
                        e.target.value as ReservationStatus
                      )
                    }
                    className="border border-char bg-ink px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-bone/80 focus:border-ember/70 focus:outline-none"
                  >
                    {RESERVATION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("¿Eliminar esta reserva?"))
                        deleteReservation(r.id);
                    }}
                    aria-label="Eliminar reserva"
                    className="inline-flex h-9 w-9 items-center justify-center border border-char text-bone/50 transition-colors hover:border-red-400 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
