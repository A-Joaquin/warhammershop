"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/contexts/cart-context";

/**
 * Añadido rápido sobre la imagen de la tarjeta. Va dentro del <Link> de la
 * card, así que detiene la navegación al pulsarlo. Solo se muestra en piezas
 * disponibles (lo decide ProductCard).
 */
export function CardAddButton({ product }: { product: Product }) {
  const { add, openCart } = useCart();
  const [added, setAdded] = useState(false);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!add(product)) return;
    setAdded(true);
    openCart();
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Añadir ${product.name} al carrito`}
      title="Añadir al carrito"
      className="inline-flex h-9 w-9 items-center justify-center border border-char bg-ink-2/90 text-bone backdrop-blur-sm transition-colors hover:border-ember hover:bg-ember hover:text-ink"
    >
      {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
    </button>
  );
}
