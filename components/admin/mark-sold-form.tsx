"use client";

import { useState } from "react";
import type { Product, SaleChannel } from "@/lib/types";
import { productCost } from "@/lib/types";
import type { MarkSoldInput } from "@/lib/contexts/admin-store";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ComboBox } from "@/components/admin/combobox";

const CHANNELS: { value: SaleChannel; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "en_tienda", label: "En tienda" },
  { value: "otro", label: "Otro" },
];

/**
 * Formulario para registrar la venta de una pieza. Confirma precio final, canal
 * y nota; al enviar, el store cambia el estado a `sold` e inserta en `sales`
 * (transacción mock, brief §4.3).
 */
export function MarkSoldForm({
  product,
  categories,
  onConfirm,
  onCancel,
}: {
  product: Product;
  categories: string[];
  onConfirm: (input: MarkSoldInput) => void;
  onCancel: () => void;
}) {
  const [soldPrice, setSoldPrice] = useState(product.price);
  const [channel, setChannel] = useState<SaleChannel>("whatsapp");
  const [category2, setCategory2] = useState(product.category2 ?? "");
  const [buyerNote, setBuyerNote] = useState("");

  const cost = productCost(product);
  const profit = (Number(soldPrice) || 0) - cost;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      soldPrice: Number(soldPrice) || 0,
      channel,
      category2: category2.trim() || undefined,
      buyerNote: buyerNote.trim() || undefined,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="border border-char bg-ink p-4">
        <p className="font-display text-base uppercase tracking-wide text-bone">
          {product.name}
        </p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-bone/40">
          {product.sku}
          {product.category ? ` · ${product.category}` : ""} · costo{" "}
          {formatPrice(cost, product.currency)}
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/45">
          Precio final de venta
        </span>
        <Input
          type="number"
          min={0}
          value={soldPrice}
          onChange={(e) => setSoldPrice(Number(e.target.value))}
          autoFocus
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-bone/45">
          Ganancia:{" "}
          <span className={profit >= 0 ? "text-emerald-300" : "text-red-400"}>
            {formatPrice(profit, product.currency)}
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/45">
          Canal
        </span>
        <div className="flex gap-2">
          {CHANNELS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setChannel(c.value)}
              className={cn(
                "flex-1 border px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                channel === c.value
                  ? "border-ember bg-ember/10 text-ember"
                  : "border-char text-bone/55 hover:border-steel"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/45">
          2ª categoría (opcional)
        </span>
        <ComboBox
          value={category2}
          onChange={setCategory2}
          options={categories}
          placeholder="Etiqueta extra para esta venta"
        />
        <span className="font-mono text-[9px] tracking-[0.1em] text-bone/35">
          Se guarda en la venta y como categoría secundaria del producto.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/45">
          Nota (opcional)
        </span>
        <Textarea
          rows={3}
          value={buyerNote}
          onChange={(e) => setBuyerNote(e.target.value)}
          placeholder="Comprador, detalle de envío, etc."
        />
      </label>

      <div className="flex justify-end gap-3 border-t border-char pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="border border-bone/30 px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-bone transition-colors hover:border-bone"
        >
          Cancelar
        </button>
        <Button type="submit">Confirmar venta</Button>
      </div>
    </form>
  );
}
