import { cn } from "@/lib/utils";
import type { ProductStatus, ProductCondition, ProductDiscount } from "@/lib/types";
import { discountAmount } from "@/lib/types";

function currencySymbol(currency: string) {
  return currency === "BOB" ? "Bs" : currency === "USD" ? "$" : "";
}

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

export function DiscountBadge({
  discount,
  price,
  currency,
  className,
}: {
  discount: ProductDiscount;
  price: number;
  currency: string;
  className?: string;
}) {
  const isPercentage = discount.type === "percentage";
  const numberPart = (
    isPercentage ? discount.value : discountAmount({ price, discount })
  ).toLocaleString("es-BO", { maximumFractionDigits: 0 });
  const unitPart = isPercentage ? "%" : currencySymbol(currency);

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 border border-red-500/40 bg-red-500/10 px-2.5 py-1",
        className
      )}
    >
      <span className="font-mono text-[10px] font-bold text-red-400">-</span>
      <span className="font-display text-base font-bold leading-none text-red-400">
        {numberPart}
      </span>
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-red-400">
        {unitPart}
      </span>
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
