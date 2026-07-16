"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useAdminStore } from "@/lib/contexts/admin-store";
import { formatDate, cn } from "@/lib/utils";
import { PageHeader, Panel } from "@/components/admin/admin-ui";
import { Stars } from "@/components/ui/stars";

export default function AdminReviewsPage() {
  const { reviews, markReviewsSeen, toggleReviewHidden } = useAdminStore();
  const [onlyLow, setOnlyLow] = useState(true);

  // Al abrir la página, se limpia el aviso de reseñas bajas sin revisar.
  useEffect(() => {
    markReviewsSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => (onlyLow ? reviews.filter((r) => r.rating <= 3) : reviews),
    [reviews, onlyLow]
  );

  return (
    <div>
      <PageHeader title="Reseñas" subtitle="Moderación de calificaciones de producto" />

      <div className="mb-5 flex gap-2">
        <FilterButton active={onlyLow} onClick={() => setOnlyLow(true)}>
          Bajas (≤3★)
        </FilterButton>
        <FilterButton active={!onlyLow} onClick={() => setOnlyLow(false)}>
          Todas
        </FilterButton>
      </div>

      <Panel className="overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-5 py-16 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-bone/35">
            {onlyLow ? "Sin reseñas bajas." : "Sin reseñas todavía."}
          </p>
        ) : (
          <ul className="divide-y divide-char">
            {filtered.map((r) => (
              <li
                key={r.id}
                className={cn(
                  "flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between",
                  r.rating <= 3 && "bg-red-400/[0.04]"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {r.rating <= 3 && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />}
                    <Link
                      href={`/producto/${r.productSlug}`}
                      target="_blank"
                      className="font-display text-sm uppercase tracking-wide text-bone hover:text-ember"
                    >
                      {r.productName}
                    </Link>
                    {r.hidden && (
                      <span className="border border-bone/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-bone/45">
                        Oculta
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-bone/45">
                    {r.reviewerName} · {formatDate(r.createdAt)}
                  </p>
                  <Stars value={r.rating} className="mt-1.5" />
                  {r.comment && (
                    <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-bone/65">
                      {r.comment}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggleReviewHidden(r.id, !r.hidden)}
                  className="inline-flex shrink-0 items-center gap-1.5 border border-char px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-bone/60 transition-colors hover:border-ember hover:text-ember"
                >
                  {r.hidden ? (
                    <>
                      <Eye className="h-3.5 w-3.5" /> Mostrar
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5" /> Ocultar
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
        active ? "border-ember bg-ember/10 text-ember" : "border-char text-bone/55 hover:border-steel"
      )}
    >
      {children}
    </button>
  );
}
