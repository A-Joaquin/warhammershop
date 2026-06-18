import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { factionName } from "@/lib/data/factions";
import { StatusBadge, ConditionTag } from "@/components/catalog/status-badge";
import { CardAddButton } from "@/components/cart/card-add-button";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const cover = product.images[0];
  const isSold = product.status === "sold";
  const isAvailable = product.status === "available" && product.stockQty > 0;

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group relative flex flex-col border border-char bg-ink-2 transition-colors duration-300 hover:border-ember/50"
    >
      {/* Imagen sobre panel de estudio claro */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-[#f4f1ea] to-[#cdc7ba]">
        <Image
          src={cover.url}
          alt={cover.alt}
          fill
          sizes="(max-width:768px) 50vw, (max-width:1200px) 33vw, 25vw"
          priority={priority}
          className={cn(
            "object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]",
            isSold && "opacity-60 grayscale"
          )}
        />
        <div className="absolute left-3 top-3">
          <StatusBadge status={product.status} />
        </div>
        {isAvailable && (
          <div className="absolute right-3 top-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
            <CardAddButton product={product} />
          </div>
        )}
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rotate-[-8deg] border-2 border-bone/70 px-4 py-1 font-display text-lg font-bold uppercase tracking-[0.2em] text-bone/80">
              Vendido
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ember">
            {factionName(product.faction)}
          </span>
          <ConditionTag condition={product.condition} />
        </div>

        <h3 className="mt-2 font-display text-lg font-semibold uppercase leading-tight tracking-wide text-bone">
          {product.name}
        </h3>
        <p className="mt-1 font-mono text-[10px] tracking-[0.1em] text-bone/35">
          {product.sku}
        </p>

        <div className="mt-auto flex items-end justify-between pt-4">
          <span className="font-display text-xl font-bold text-bone">
            {formatPrice(product.price, product.currency)}
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.16em] text-bone/50 transition-colors group-hover:text-ember">
            Ver
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
