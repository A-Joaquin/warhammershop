"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/contexts/cart-context";

/** Botón del header que abre el carrito y muestra el número de piezas. */
export function CartButton({ className }: { className?: string }) {
  const { count, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Abrir carrito (${count})`}
      className={
        "relative inline-flex h-10 w-10 items-center justify-center border border-steel/70 text-bone transition-colors hover:border-ember hover:text-ember " +
        (className ?? "")
      }
    >
      <ShoppingBag className="h-4.5 w-4.5" />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 font-mono text-[10px] font-bold text-ink">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
