"use client";

import { productCost, productCostUsd } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

/**
 * Resumen en vivo de costo / ganancia / margen / tipo de cambio implícito a
 * partir de los precios de compra (BOB + USD), impuesto y precio de venta.
 */
export function ProfitPreview({
  purchase,
  purchaseUsd,
  taxRate,
  sale,
  currency,
}: {
  purchase: number;
  purchaseUsd: number;
  taxRate: number;
  sale: number;
  currency: string;
}) {
  const cost = productCost({ purchasePrice: purchase, taxRate });
  const costUsd = productCostUsd({ purchasePriceUsd: purchaseUsd, taxRate });
  const profit = sale - cost;
  const margin = sale > 0 ? (profit / sale) * 100 : 0;
  // Tipo de cambio implícito (Bs por 1 USD) con el que se compró la pieza.
  const fx = purchaseUsd > 0 ? purchase / purchaseUsd : 0;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-char pt-3 font-mono text-[11px] uppercase tracking-[0.12em]">
      <span className="text-bone/45">
        Costo:{" "}
        <span className="text-bone/80">{formatPrice(cost, currency)}</span>
        {costUsd > 0 && (
          <span className="text-bone/40"> · {formatPrice(costUsd, "USD")}</span>
        )}
      </span>
      <span className="text-bone/45">
        Ganancia:{" "}
        <span className={profit >= 0 ? "text-emerald-300" : "text-red-400"}>
          {formatPrice(profit, currency)}
        </span>
      </span>
      <span className="text-bone/45">
        Margen:{" "}
        <span className={profit >= 0 ? "text-emerald-300" : "text-red-400"}>
          {margin.toFixed(0)}%
        </span>
      </span>
      {fx > 0 && (
        <span className="text-bone/45">
          T/C: <span className="text-bone/80">{fx.toFixed(2)} Bs/$</span>
        </span>
      )}
    </div>
  );
}
