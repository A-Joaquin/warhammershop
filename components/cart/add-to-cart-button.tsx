"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "@/lib/contexts/cart-context";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/** Botón principal de la ficha: añade la pieza y abre el carrito. */
export function AddToCartButton({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const { add, openCart, has } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const inCart = has(product.slug);

  const onClick = () => {
    const ok = add(product);
    if (!ok) return;
    setJustAdded(true);
    openCart();
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(buttonVariants({ variant: "primary", size: "lg" }), className)}
    >
      {justAdded ? (
        <>
          <Check className="h-4 w-4" /> Añadido al carrito
        </>
      ) : (
        <>
          <ShoppingBag className="h-4 w-4" />
          {inCart ? "Añadir otra unidad" : "Añadir al carrito"}
        </>
      )}
    </button>
  );
}
