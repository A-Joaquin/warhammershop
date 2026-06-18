import { cn } from "@/lib/utils";
import type { ProductStatus, ProductCondition } from "@/lib/types";

const STATUS_MAP: Record<
  ProductStatus,
  { label: string; className: string; dot: string }
> = {
  available: {
    label: "Disponible",
    className: "text-emerald-300 border-emerald-400/40 bg-emerald-400/10",
    dot: "bg-emerald-400",
  },
  reserved: {
    label: "Reservado",
    className: "text-gold border-gold/40 bg-gold/10",
    dot: "bg-gold",
  },
  sold: {
    label: "Vendido",
    className: "text-bone/50 border-bone/20 bg-bone/5",
    dot: "bg-bone/40",
  },
  coming_soon: {
    label: "Próximo lanzamiento",
    className: "text-ember-2 border-ember/40 bg-ember/10",
    dot: "bg-ember",
  },
};

const CONDITION_LABEL: Record<ProductCondition, string> = {
  nuevo: "Nuevo",
  caja_abierta: "Caja abierta",
  usado: "Usado",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProductStatus;
  className?: string;
}) {
  const s = STATUS_MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] uppercase",
        s.className,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function ConditionTag({ condition }: { condition: ProductCondition }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-bone/45">
      {CONDITION_LABEL[condition]}
    </span>
  );
}

export { CONDITION_LABEL };
