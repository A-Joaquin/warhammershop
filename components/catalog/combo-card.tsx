import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Boxes } from "lucide-react";
import type { Combo } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export function ComboCard({ combo }: { combo: Combo }) {
  const includedNames = combo.items
    .map((i) => i.product?.name)
    .filter((n): n is string => Boolean(n));

  return (
    <Link
      href={`/combo/${combo.slug}`}
      className="group relative flex flex-col border border-char bg-ink-2 transition-colors duration-300 hover:border-ember/50"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-[#f4f1ea] to-[#cdc7ba]">
        {combo.imageUrl ? (
          <Image
            src={combo.imageUrl}
            alt={combo.name}
            fill
            sizes="(max-width:768px) 50vw, (max-width:1200px) 33vw, 25vw"
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Boxes className="h-16 w-16 text-ink/25" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <span className="border border-ember/50 bg-ink/80 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ember">
            Combo
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-semibold uppercase leading-tight tracking-wide text-bone">
          {combo.name}
        </h3>
        {includedNames.length > 0 && (
          <p className="mt-1 line-clamp-2 font-mono text-[10px] tracking-[0.05em] text-bone/40">
            {includedNames.join(" · ")}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between pt-4">
          <span className="font-display text-xl font-bold text-bone">
            {formatPrice(combo.price, combo.currency)}
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
