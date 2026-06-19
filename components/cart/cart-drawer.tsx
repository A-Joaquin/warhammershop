"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/lib/contexts/cart-context";
import { waCartLink } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/utils";
import { WhatsAppButton } from "@/components/whatsapp-button";

/** Panel lateral con el contenido del carrito. Montado globalmente en el layout. */
export function CartDrawer() {
  const { items, total, isOpen, closeCart, remove, setQty, clear } = useCart();

  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, closeCart]);

  const currency = items[0]?.currency ?? "BOB";

  return (
    <div
      className={
        "fixed inset-0 z-[120] " + (isOpen ? "" : "pointer-events-none")
      }
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className={
          "absolute inset-0 bg-ink/80 backdrop-blur-sm transition-opacity duration-300 " +
          (isOpen ? "opacity-100" : "opacity-0")
        }
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compra"
        className={
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-char bg-ink-2 shadow-2xl transition-transform duration-300 ease-out " +
          (isOpen ? "translate-x-0" : "translate-x-full")
        }
      >
        {/* Cabecera */}
        <header className="flex items-center justify-between border-b border-char px-6 py-5">
          <span className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-[0.12em] text-bone">
            <ShoppingBag className="h-5 w-5 text-ember" />
            Tu pedido
          </span>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar carrito"
            className="text-bone/60 transition-colors hover:text-bone"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-12 w-12 text-bone/20" />
            <p className="font-display text-lg uppercase tracking-wide text-bone/60">
              Carrito vacío
            </p>
            <p className="max-w-xs text-sm text-bone/40">
              Añade piezas del catálogo y coordina todo en un solo mensaje de
              WhatsApp.
            </p>
            <Link
              href="/tienda"
              onClick={closeCart}
              className="mt-2 inline-flex items-center justify-center border border-bone/30 px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-bone transition-colors hover:border-ember hover:text-ember"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-char overflow-y-auto">
            {items.map((it) => (
              <li key={it.slug} className="flex gap-4 px-6 py-4">
                <Link
                  href={`/producto/${it.slug}`}
                  onClick={closeCart}
                  className="relative h-20 w-16 shrink-0 overflow-hidden border border-char bg-gradient-to-b from-[#f4f1ea] to-[#cdc7ba]"
                >
                  {it.image && (
                    <Image
                      src={it.image}
                      alt={it.name}
                      fill
                      sizes="64px"
                      className="object-contain p-1.5"
                    />
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/producto/${it.slug}`}
                    onClick={closeCart}
                    className="font-display text-sm font-semibold uppercase leading-tight tracking-wide text-bone hover:text-ember"
                  >
                    {it.name}
                  </Link>
                  <span className="mt-0.5 font-mono text-[10px] tracking-[0.1em] text-bone/35">
                    {it.sku}
                  </span>

                  <div className="mt-auto flex items-center justify-between pt-2">
                    {/* Control de cantidad */}
                    <div className="flex items-center border border-char">
                      <button
                        type="button"
                        onClick={() => setQty(it.slug, it.qty - 1)}
                        aria-label="Quitar una unidad"
                        className="flex h-7 w-7 items-center justify-center text-bone/70 transition-colors hover:text-ember"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center font-mono text-xs text-bone">
                        {it.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(it.slug, it.qty + 1)}
                        disabled={it.qty >= it.stockQty}
                        aria-label="Añadir una unidad"
                        className="flex h-7 w-7 items-center justify-center text-bone/70 transition-colors hover:text-ember disabled:opacity-30 disabled:hover:text-bone/70"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <span className="font-display text-sm font-bold text-bone">
                      {formatPrice(it.price * it.qty, it.currency)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => remove(it.slug)}
                  aria-label={`Quitar ${it.name}`}
                  className="self-start text-bone/30 transition-colors hover:text-ember"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Pie con total y checkout por WhatsApp */}
        {items.length > 0 && (
          <footer className="border-t border-char px-6 py-5">
            <div className="flex items-end justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-bone/50">
                Total
              </span>
              <span className="font-display text-2xl font-bold text-bone">
                {formatPrice(total, currency)}
              </span>
            </div>

            <WhatsAppButton
              href={waCartLink(items)}
              size="lg"
              className="mt-4 w-full"
            >
              Finalizar pedido por WhatsApp
            </WhatsAppButton>

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-bone/40 transition-colors hover:text-ember"
              >
                <Trash2 className="h-3 w-3" /> Vaciar carrito
              </button>
              <button
                type="button"
                onClick={closeCart}
                className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone/40 transition-colors hover:text-bone"
              >
                Seguir viendo
              </button>
            </div>

            <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-[0.08em] text-bone/30">
              Sin pago online. Cerramos la venta y coordinamos el envío
              directamente por WhatsApp.
            </p>
          </footer>
        )}
      </aside>
    </div>
  );
}
