"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus, Search, Trash2, Upload } from "lucide-react";
import type { Product } from "@/lib/types";
import type { ComboInput, FactionOption } from "@/lib/contexts/admin-store";
import { factionName } from "@/lib/data/factions";
import { slugify, formatPrice, cn } from "@/lib/utils";
import { uploadProductImage } from "@/lib/images";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/admin/form-fields";

function emptyInput(): ComboInput {
  return {
    name: "",
    slug: "",
    description: "",
    price: 0,
    currency: "BOB",
    imageUrl: null,
    items: [],
  };
}

export function ComboForm({
  products,
  factions,
  onSubmit,
  onCancel,
}: {
  products: Product[];
  factions: FactionOption[];
  onSubmit: (input: ComboInput) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ComboInput>(emptyInput());
  const [slugTouched, setSlugTouched] = useState(false);
  const [query, setQuery] = useState("");
  const [faction, setFaction] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ComboInput>(key: K, value: ComboInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setName = (name: string) =>
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));

  const selectable = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (faction && p.faction !== faction) return false;
      if (q && !`${p.name} ${p.sku}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, query, faction]);

  const originalTotal = useMemo(() => {
    return form.items.reduce((sum, it) => {
      const p = products.find((pr) => pr.id === it.productId);
      return sum + (p ? p.price * it.quantity : 0);
    }, 0);
  }, [form.items, products]);

  const toggleProduct = (productId: string) => {
    setForm((f) => {
      const exists = f.items.find((it) => it.productId === productId);
      if (exists) {
        return { ...f, items: f.items.filter((it) => it.productId !== productId) };
      }
      return { ...f, items: [...f.items, { productId, quantity: 1 }] };
    });
  };

  const setQuantity = (productId: string, quantity: number) =>
    setForm((f) => ({
      ...f,
      items: f.items.map((it) =>
        it.productId === productId ? { ...it, quantity: Math.max(1, quantity) } : it
      ),
    }));

  const onUploadImage = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      set("imageUrl", url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("El nombre es obligatorio.");
    if (form.items.length < 2)
      return setError("Elige al menos 2 productos para el combo.");
    if (!(Number(form.price) > 0)) return setError("Indica un precio válido.");
    setError(null);
    onSubmit({
      ...form,
      slug: form.slug || slugify(form.name),
      price: Number(form.price) || 0,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Field label="Nombre del combo">
        <Input
          value={form.name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Escuadra Cadiana + Comisario"
        />
      </Field>

      <Field label="Slug (URL)">
        <Input
          value={form.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", slugify(e.target.value));
          }}
          placeholder="escuadra-cadiana-comisario"
        />
      </Field>

      {/* Selección de productos */}
      <Field label={`Productos incluidos (${form.items.length} seleccionados)`}>
        <div className="flex flex-col gap-2 border border-char bg-ink p-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bone/40" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre o SKU…"
                className="pl-10"
              />
            </div>
            <Select value={faction} onChange={(e) => setFaction(e.target.value)} className="sm:w-56">
              <option value="">Todas las facciones</option>
              {factions.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {f.name}
                </option>
              ))}
            </Select>
          </div>

          {selectable.length === 0 ? (
            <p className="py-6 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-bone/35">
              Sin piezas que coincidan.
            </p>
          ) : (
            <ul className="max-h-[35vh] divide-y divide-char overflow-y-auto">
              {selectable.map((p) => {
                const picked = form.items.some((it) => it.productId === p.id);
                return (
                  <li key={p.id}>
                    <label className="flex w-full cursor-pointer items-center gap-3 px-1 py-2.5 text-left transition-colors hover:bg-bone/5">
                      <input
                        type="checkbox"
                        checked={picked}
                        onChange={() => toggleProduct(p.id)}
                        className="h-4 w-4 accent-ember"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm uppercase tracking-wide text-bone">
                          {p.name}
                        </p>
                        <p className="font-mono text-[10px] tracking-[0.1em] text-bone/35">
                          {p.sku} · {factionName(p.faction)}
                        </p>
                      </div>
                      <span className="shrink-0 font-display text-sm font-bold text-bone">
                        {formatPrice(p.price, p.currency)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Field>

      {/* Cantidades de los productos elegidos */}
      {form.items.length > 0 && (
        <div className="flex flex-col gap-2 border border-char bg-ink-2 p-3">
          {form.items.map((it) => {
            const p = products.find((pr) => pr.id === it.productId);
            if (!p) return null;
            return (
              <div key={it.productId} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[11px] tracking-[0.05em] text-bone/70">
                    {p.name}
                  </p>
                  <p className="font-mono text-[10px] tracking-[0.05em] text-bone/35">
                    {formatPrice(p.price, p.currency)} c/u · subtotal{" "}
                    {formatPrice(p.price * it.quantity, p.currency)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuantity(it.productId, it.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center border border-char text-bone/60 hover:border-ember hover:text-ember"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center font-mono text-xs text-bone">
                    {it.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(it.productId, it.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center border border-char text-bone/60 hover:border-ember hover:text-ember"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => toggleProduct(it.productId)}
                  aria-label="Quitar del combo"
                  className="flex h-7 w-7 items-center justify-center border border-char text-bone/50 hover:border-red-400 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {form.items.length > 0 && (() => {
        const comboPrice = Number(form.price || 0);
        const savings = originalTotal - comboPrice;
        const pct = originalTotal > 0 ? (savings / originalTotal) * 100 : 0;
        const isDiscount = savings > 0;
        return (
          <div className="flex flex-col gap-3 border border-char bg-ink p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone/40">
              Resumen de precio
            </p>
            <div className="flex flex-col gap-1.5">
              {form.items.map((it) => {
                const p = products.find((pr) => pr.id === it.productId);
                if (!p) return null;
                const subtotal = p.price * it.quantity;
                const share = originalTotal > 0 ? subtotal / originalTotal : 0;
                const withDiscount = comboPrice * share;
                const discount = subtotal - withDiscount;
                return (
                  <div key={it.productId} className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate font-mono text-[11px] tracking-[0.05em] text-bone/60">
                      {p.name}
                    </p>
                    <p className="shrink-0 font-mono text-[11px] tracking-[0.05em] text-bone/50">
                      {formatPrice(subtotal, form.currency)} → {formatPrice(withDiscount, form.currency)}{" "}
                      <span className={discount > 0 ? "text-emerald-400" : "text-red-400"}>
                        (-{formatPrice(discount, form.currency)})
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-char pt-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone/40">
                  Suma de precios originales
                </p>
                <p className="font-display text-sm font-bold text-bone">
                  {formatPrice(originalTotal, form.currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone/40">
                  {isDiscount ? "Ahorro" : "Diferencia"}
                </p>
                <p
                  className={cn(
                    "font-display text-sm font-bold",
                    isDiscount ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {formatPrice(savings, form.currency)} ({pct.toFixed(0)}%)
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Precio del combo">
          <Input
            type="number"
            min={0}
            value={form.price === 0 ? "" : form.price}
            onChange={(e) => set("price", e.target.value === "" ? 0 : Number(e.target.value))}
            placeholder="0"
          />
        </Field>
        <Field label="Moneda">
          <Select value={form.currency} onChange={(e) => set("currency", e.target.value)}>
            <option value="BOB">BOB (Bs)</option>
            <option value="USD">USD ($)</option>
          </Select>
        </Field>
      </div>

      <Field label="Descripción">
        <Textarea
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Descripción del combo…"
        />
      </Field>

      {/* Imagen opcional del combo */}
      <Field label="Imagen del combo (opcional)">
        <div className="flex items-center gap-4">
          {form.imageUrl ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-char bg-gradient-to-b from-[#f4f1ea] to-[#cdc7ba]">
              <Image src={form.imageUrl} alt="" fill sizes="80px" className="object-contain p-1" />
            </div>
          ) : null}
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 border border-char bg-ink-2 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-bone/70 transition-colors hover:border-ember hover:text-ember",
              uploading && "pointer-events-none opacity-50"
            )}
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Subiendo…" : form.imageUrl ? "Cambiar imagen" : "Subir imagen"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadImage(file);
                e.target.value = "";
              }}
            />
          </label>
          {form.imageUrl && (
            <button
              type="button"
              onClick={() => set("imageUrl", null)}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-ember/80 hover:text-ember"
            >
              Quitar
            </button>
          )}
        </div>
      </Field>

      {error && <p className="font-mono text-[11px] text-red-400">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-char pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="border border-bone/30 px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-bone transition-colors hover:border-bone"
        >
          Cancelar
        </button>
        <Button type="submit" disabled={uploading}>
          Crear combo
        </Button>
      </div>
    </form>
  );
}
