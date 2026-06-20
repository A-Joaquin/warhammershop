"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import type { Product } from "@/lib/types";
import type { ProductInput, FactionOption } from "@/lib/contexts/admin-store";
import { factionName } from "@/lib/data/factions";
import { slugify } from "@/lib/utils";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ComboBox } from "@/components/admin/combobox";
import { FactionIconPicker } from "@/components/admin/icon-picker";
import { ImageEditor } from "@/components/admin/image-editor";
import { ProfitPreview } from "@/components/admin/profit-preview";
import { Field, Select, Check } from "@/components/admin/form-fields";

const CONDITIONS: { value: Product["condition"]; label: string }[] = [
  { value: "nuevo", label: "Nuevo" },
  { value: "caja_abierta", label: "Caja abierta" },
  { value: "usado", label: "Usado" },
];

const STATUSES: { value: Product["status"]; label: string }[] = [
  { value: "available", label: "Disponible" },
  { value: "reserved", label: "Reservado" },
  { value: "sold", label: "Vendido" },
  { value: "coming_soon", label: "Próximo lanzamiento" },
];

function emptyInput(): ProductInput {
  return {
    name: "",
    slug: "",
    faction: "",
    line: "",
    sku: "",
    description: "",
    condition: "nuevo",
    price: 0,
    currency: "BOB",
    status: "available",
    releaseDate: "",
    isPreorder: false,
    stockQty: 1,
    featured: false,
    images: [],
    category: "",
    category2: "",
    purchasePrice: 0,
    purchasePriceUsd: 0,
    taxRate: 13,
  };
}

function fromProduct(p: Product): ProductInput {
  return {
    name: p.name,
    slug: p.slug,
    faction: p.faction,
    line: p.line,
    sku: p.sku,
    description: p.description,
    condition: p.condition,
    price: p.price,
    currency: p.currency,
    status: p.status,
    releaseDate: p.releaseDate ?? "",
    isPreorder: p.isPreorder ?? false,
    stockQty: p.stockQty,
    featured: p.featured ?? false,
    images: p.images.map((i) => ({ ...i })),
    category: p.category ?? "",
    category2: p.category2 ?? "",
    purchasePrice: p.purchasePrice ?? 0,
    purchasePriceUsd: p.purchasePriceUsd ?? 0,
    taxRate: p.taxRate ?? 13,
  };
}

export function ProductForm({
  product,
  categories,
  factions,
  onSubmit,
  onCancel,
}: {
  product?: Product;
  categories: string[];
  factions: FactionOption[];
  onSubmit: (input: ProductInput) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ProductInput>(
    product ? fromProduct(product) : emptyInput()
  );
  // Facción/marca como texto editable (elegir existente o escribir nueva).
  const [factionText, setFactionText] = useState(
    product
      ? factions.find((f) => f.slug === product.faction)?.name ??
          factionName(product.faction)
      : ""
  );
  // Ícono de la facción (logo). Se precarga del de la facción actual si la tiene.
  const [factionLogo, setFactionLogo] = useState(
    product
      ? factions.find((f) => f.slug === product.faction)?.logo ?? ""
      : ""
  );
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  // Al elegir/escribir una facción existente, refleja su ícono actual.
  const onFactionText = (v: string) => {
    setFactionText(v);
    const match = factions.find(
      (f) => f.name.toLowerCase() === v.trim().toLowerCase()
    );
    if (match) setFactionLogo(match.logo ?? "");
  };
  // Mantener el slug en sincronía con el nombre hasta que el usuario lo edite.
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setName = (name: string) =>
    setForm((f) => ({
      ...f,
      name,
      slug: slugTouched ? f.slug : slugify(name),
    }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("El nombre es obligatorio.");
    if (!form.sku.trim()) return setError("El SKU es obligatorio.");
    const ftext = factionText.trim();
    if (!ftext) return setError("Indica la facción o marca.");
    if (form.images.length === 0)
      return setError("Añade al menos una imagen.");
    setError(null);
    // Resuelve a slug: si coincide con una existente la reusa, si no, crea slug nuevo.
    const existing = factions.find(
      (f) =>
        f.name.toLowerCase() === ftext.toLowerCase() ||
        f.slug === ftext.toLowerCase()
    );
    const factionSlug = existing ? existing.slug : slugify(ftext);
    onSubmit({
      ...form,
      faction: factionSlug,
      factionLogo,
      slug: form.slug || slugify(form.name),
      price: Number(form.price) || 0,
      stockQty: Number(form.stockQty) || 0,
      releaseDate: form.status === "coming_soon" ? form.releaseDate : undefined,
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <FactionIconPicker
        open={iconPickerOpen}
        value={factionLogo}
        onPick={setFactionLogo}
        onClose={() => setIconPickerOpen(false)}
      />

      <Field label="Nombre">
        <Input value={form.name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Mariscal Helbrecht" />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Slug (URL)">
          <Input
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              set("slug", slugify(e.target.value));
            }}
            placeholder="mariscal-helbrecht"
          />
        </Field>
        <Field label="SKU / código (para buscar)">
          <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="BT-HB-002" />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Facción / marca">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <ComboBox
                value={factionText}
                onChange={onFactionText}
                options={factions.map((f) => f.name)}
                placeholder="Ej. Space Marines, Evangelion (o escribe una nueva)"
              />
            </div>
            <button
              type="button"
              onClick={() => setIconPickerOpen(true)}
              title="Elegir ícono de la facción"
              className="flex shrink-0 items-center gap-2 border border-char bg-ink-2 px-3 text-bone/70 transition-colors hover:border-ember hover:text-ember"
            >
              {factionLogo ? (
                <Image
                  src={factionLogo}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
              <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                Ícono
              </span>
            </button>
          </div>
        </Field>
        <Field label="Línea / set">
          <Input value={form.line} onChange={(e) => set("line", e.target.value)} placeholder="Personajes · Black Templars" />
        </Field>
      </div>

      {/* Categorías (elegir existente o escribir nueva) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Categoría">
          <ComboBox
            value={form.category ?? ""}
            onChange={(v) => set("category", v)}
            options={categories}
            placeholder="Ej. Personaje (o escribe una nueva)"
          />
        </Field>
        <Field label="2ª categoría (opcional)">
          <ComboBox
            value={form.category2 ?? ""}
            onChange={(v) => set("category2", v)}
            options={categories}
            placeholder="Opcional"
          />
        </Field>
      </div>

      {/* Precios: compra (BOB + USD) + impuesto = costo; venta = precio público */}
      <div className="border border-char bg-ink p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Compra (Bs)">
            <Input
              type="number"
              min={0}
              value={form.purchasePrice ?? 0}
              onChange={(e) => set("purchasePrice", Number(e.target.value))}
            />
          </Field>
          <Field label="Compra (USD)">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.purchasePriceUsd ?? 0}
              onChange={(e) => set("purchasePriceUsd", Number(e.target.value))}
            />
          </Field>
          <Field label="Impuesto (%)">
            <Input
              type="number"
              min={0}
              value={form.taxRate ?? 0}
              onChange={(e) => set("taxRate", Number(e.target.value))}
            />
          </Field>
          <Field label="Precio de venta">
            <Input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => set("price", Number(e.target.value))}
            />
          </Field>
        </div>
        <ProfitPreview
          purchase={Number(form.purchasePrice) || 0}
          purchaseUsd={Number(form.purchasePriceUsd) || 0}
          taxRate={Number(form.taxRate) || 0}
          sale={Number(form.price) || 0}
          currency={form.currency}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Moneda">
          <Select value={form.currency} onChange={(e) => set("currency", e.target.value)}>
            <option value="BOB">BOB (Bs)</option>
            <option value="USD">USD ($)</option>
          </Select>
        </Field>
        <Field label="Stock">
          <Input
            type="number"
            min={0}
            value={form.stockQty}
            onChange={(e) => set("stockQty", Number(e.target.value))}
          />
        </Field>
        <Field label="Condición">
          <Select value={form.condition} onChange={(e) => set("condition", e.target.value as Product["condition"])}>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Estado">
          <Select value={form.status} onChange={(e) => set("status", e.target.value as Product["status"])}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        {form.status === "coming_soon" && (
          <Field label="Fecha de lanzamiento">
            <Input
              type="date"
              value={form.releaseDate}
              onChange={(e) => set("releaseDate", e.target.value)}
            />
          </Field>
        )}
      </div>

      <Field label="Descripción">
        <Textarea
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Descripción larga de la pieza…"
        />
      </Field>

      <div className="flex flex-wrap gap-6">
        <Check label="Destacado" checked={!!form.featured} onChange={(v) => set("featured", v)} />
        <Check label="Pre-pedido" checked={!!form.isPreorder} onChange={(v) => set("isPreorder", v)} />
      </div>

      {/* Editor de imágenes */}
      <ImageEditor
        images={form.images}
        onChange={(images) => setForm((f) => ({ ...f, images }))}
        altFallback={form.name || "Imagen de producto"}
        onUploadingChange={setUploading}
      />

      {error && (
        <p className="font-mono text-[11px] text-red-400">{error}</p>
      )}

      <div className="flex justify-end gap-3 border-t border-char pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="border border-bone/30 px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.12em] text-bone transition-colors hover:border-bone"
        >
          Cancelar
        </button>
        <Button type="submit" disabled={uploading}>
          {product ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
