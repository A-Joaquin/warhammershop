"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, Trash2 } from "lucide-react";
import type { Product, ProductDiscount } from "@/lib/types";
import { discountAmount, discountedPrice, isDiscountActive } from "@/lib/types";
import { useAdminStore } from "@/lib/contexts/admin-store";
import { factionName, FACTIONS } from "@/lib/data/factions";
import { formatPrice, cn } from "@/lib/utils";
import { PageHeader, Panel } from "@/components/admin/admin-ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Row {
  checked: boolean;
  type: "percentage" | "fixed";
  value: number;
  validFrom: string;
  validUntil: string;
}

type BulkState = Omit<Row, "checked">;

const EMPTY_BULK: BulkState = { type: "percentage", value: 0, validFrom: "", validUntil: "" };

function rowFromDiscount(d: ProductDiscount | undefined): Row {
  return {
    checked: Boolean(d),
    type: d?.type ?? "percentage",
    value: d?.value ?? 0,
    validFrom: d?.validFrom ?? "",
    validUntil: d?.validUntil ?? "",
  };
}

/** Qué campos de una fila tildada están mal cargados (para resaltarlos y para validar antes de guardar). */
function getFieldErrors(row: Row, price: number) {
  if (!row.checked) {
    return { value: false, validFrom: false, validUntil: false };
  }
  const value =
    row.type === "percentage" ? row.value <= 0 || row.value > 100 : row.value <= 0 || row.value >= price;
  const validFrom = !row.validFrom;
  const validUntil = !row.validUntil || (Boolean(row.validFrom) && row.validUntil < row.validFrom);
  return { value, validFrom, validUntil };
}

export default function AdminDiscountsPage() {
  const { products, setProductDiscount } = useAdminStore();
  const [query, setQuery] = useState("");
  const [faction, setFaction] = useState("");
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkActive, setBulkActive] = useState<BulkState>(EMPTY_BULK);
  const [bulkNew, setBulkNew] = useState<BulkState>(EMPTY_BULK);

  const getRow = (id: string, discount: ProductDiscount | undefined): Row =>
    rows[id] ?? rowFromDiscount(discount);

  const setRow = (id: string, patch: Partial<Row>, discount: ProductDiscount | undefined) =>
    setRows((r) => ({ ...r, [id]: { ...getRow(id, discount), ...patch } }));

  // Aplica un lote solo a los productos de `list` que ya estén tildados —
  // así el lote de una tabla nunca toca los de la otra.
  const applyBulkTo = (list: Product[], next: BulkState) => {
    setRows((r) => {
      const copy = { ...r };
      for (const p of list) {
        const current = copy[p.id] ?? rowFromDiscount(p.discount);
        if (current.checked) copy[p.id] = { ...current, ...next };
      }
      return copy;
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (faction && p.faction !== faction) return false;
      if (q && !`${p.name} ${p.sku}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, query, faction]);

  // Se separan según el estado real en la base (no según lo que se esté
  // editando), para que una fila no "salte" de tabla mientras se edita.
  const withDiscount = useMemo(() => filtered.filter((p) => p.discount), [filtered]);
  const withoutDiscount = useMemo(() => filtered.filter((p) => !p.discount), [filtered]);

  const updateBulkActive = (patch: Partial<BulkState>) =>
    setBulkActive((b) => {
      const next = { ...b, ...patch };
      applyBulkTo(withDiscount, next);
      return next;
    });

  const updateBulkNew = (patch: Partial<BulkState>) =>
    setBulkNew((b) => {
      const next = { ...b, ...patch };
      applyBulkTo(withoutDiscount, next);
      return next;
    });

  const save = async () => {
    setError(null);
    const entries = Object.entries(rows);
    for (const [id, row] of entries) {
      if (!row.checked) continue;
      const product = products.find((p) => p.id === id);
      if (!product) continue;
      const errors = getFieldErrors(row, product.price);
      if (errors.value) {
        return setError(
          row.type === "percentage"
            ? "El porcentaje debe estar entre 1 y 100."
            : "El monto fijo debe ser mayor a 0 y menor al precio del producto."
        );
      }
      if (errors.validFrom || errors.validUntil) {
        return setError(
          'Completa "Vigente desde" y "Vigente hasta" para activar el descuento (y que "desde" no sea posterior a "hasta").'
        );
      }
    }
    setSaving(true);
    try {
      for (const [id, row] of entries) {
        await setProductDiscount(
          id,
          row.checked
            ? {
                type: row.type,
                value: Number(row.value),
                validFrom: row.validFrom || undefined,
                validUntil: row.validUntil || undefined,
              }
            : null
        );
      }
      setRows({});
    } finally {
      setSaving(false);
    }
  };

  const cancelDiscount = async (id: string) => {
    if (!window.confirm("¿Cancelar este descuento?")) return;
    await setProductDiscount(id, null);
    setRows((r) => {
      const next = { ...r };
      delete next[id];
      return next;
    });
  };

  const hasChanges = Object.keys(rows).length > 0;

  return (
    <div>
      <PageHeader
        title="Descuentos"
        subtitle="Selecciona qué productos entran en descuento"
        action={
          <Button onClick={save} disabled={!hasChanges || saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        }
      />

      {error && <p className="mb-4 font-mono text-[11px] text-red-400">{error}</p>}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bone/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o SKU…"
            className="pl-10"
          />
        </div>
        <select
          value={faction}
          onChange={(e) => setFaction(e.target.value)}
          className="border border-char bg-ink-2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-bone/80 focus:border-ember/70 focus:outline-none"
        >
          <option value="">Todas las facciones</option>
          {FACTIONS.map((f) => (
            <option key={f.slug} value={f.slug}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.14em] text-bone/70">
        Sin descuento ({withoutDiscount.length})
      </h2>
      <BulkPanel bulk={bulkNew} onChange={updateBulkNew} />
      <DiscountsTable
        products={withoutDiscount}
        rows={rows}
        getRow={getRow}
        setRow={setRow}
        bulk={bulkNew}
        showCancel={false}
        emptyLabel="Sin resultados."
      />

      <h2 className="mb-3 mt-10 font-display text-sm font-bold uppercase tracking-[0.14em] text-bone/70">
        Con descuento ({withDiscount.length})
      </h2>
      <BulkPanel bulk={bulkActive} onChange={updateBulkActive} />
      <DiscountsTable
        products={withDiscount}
        rows={rows}
        getRow={getRow}
        setRow={setRow}
        bulk={bulkActive}
        showCancel
        onCancel={cancelDiscount}
        emptyLabel="Ningún producto tiene descuento activo todavía."
      />
    </div>
  );
}

function BulkPanel({
  bulk,
  onChange,
}: {
  bulk: BulkState;
  onChange: (patch: Partial<BulkState>) => void;
}) {
  return (
    <div className="mb-4 border border-char bg-ink-2 p-4">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-bone/40">
        Aplicar en lote a los productos ya tildados de esta tabla
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-bone/40">Tipo</span>
          <select
            value={bulk.type}
            onChange={(e) => onChange({ type: e.target.value as Row["type"] })}
            className="border border-char bg-ink px-2 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-bone/80"
          >
            <option value="percentage">Porcentaje</option>
            <option value="fixed">Monto fijo</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-bone/40">Valor</span>
          <input
            type="number"
            step={1}
            min={0}
            value={bulk.value === 0 ? "" : bulk.value}
            onChange={(e) => onChange({ value: e.target.value === "" ? 0 : Number(e.target.value) })}
            placeholder="0"
            className="w-24 border border-char bg-ink px-2 py-2 font-mono text-sm text-bone"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-bone/40">
            Vigente desde *
          </span>
          <input
            type="date"
            value={bulk.validFrom}
            onChange={(e) => onChange({ validFrom: e.target.value })}
            className="border border-char bg-ink px-2 py-2 font-mono text-[11px] text-bone"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-bone/40">
            Vigente hasta *
          </span>
          <input
            type="date"
            value={bulk.validUntil}
            onChange={(e) => onChange({ validUntil: e.target.value })}
            className="border border-char bg-ink px-2 py-2 font-mono text-[11px] text-bone"
          />
        </label>
      </div>
    </div>
  );
}

function DiscountsTable({
  products,
  rows,
  getRow,
  setRow,
  bulk,
  showCancel,
  onCancel,
  emptyLabel,
}: {
  products: Product[];
  rows: Record<string, Row>;
  getRow: (id: string, discount: ProductDiscount | undefined) => Row;
  setRow: (id: string, patch: Partial<Row>, discount: ProductDiscount | undefined) => void;
  bulk: BulkState;
  showCancel: boolean;
  onCancel?: (id: string) => void;
  emptyLabel: string;
}) {
  return (
    <Panel className="mb-2 overflow-hidden">
      {products.length === 0 ? (
        <p className="px-5 py-10 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-bone/35">
          {emptyLabel}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-char font-mono text-[10px] uppercase tracking-[0.16em] text-bone/40">
                <th className="px-4 py-3 font-normal" />
                <th className="px-4 py-3 font-normal">Producto</th>
                <th className="px-4 py-3 font-normal">Precio</th>
                <th className="px-4 py-3 font-normal">Tipo</th>
                <th className="px-4 py-3 font-normal">Valor</th>
                <th className="px-4 py-3 font-normal">Vigente desde *</th>
                <th className="px-4 py-3 font-normal">Vigente hasta *</th>
                <th className="px-4 py-3 text-right font-normal">Precio final</th>
                {showCancel && <th className="px-4 py-3 font-normal" />}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const row = getRow(p.id, p.discount);
                const previewDiscount: ProductDiscount | undefined = row.checked
                  ? {
                      id: "preview",
                      type: row.type,
                      value: Number(row.value) || 0,
                      validFrom: row.validFrom || undefined,
                      validUntil: row.validUntil || undefined,
                      createdAt: "",
                    }
                  : undefined;
                const preview = discountedPrice({ price: p.price, discount: previewDiscount });
                const active = isDiscountActive(previewDiscount);
                // Monto que se estaría descontando (ignora fechas): sirve para mostrar
                // "Equivale a -X" siempre, incluso si el descuento está programado o vencido.
                const amount = row.checked
                  ? discountAmount({
                      price: p.price,
                      discount: { id: "preview", type: row.type, value: Number(row.value) || 0, createdAt: "" },
                    })
                  : 0;
                const errors = getFieldErrors(row, p.price);

                return (
                  <tr key={p.id} className="border-b border-char/60 last:border-0 hover:bg-bone/[0.02]">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={row.checked}
                        onChange={(e) =>
                          setRow(
                            p.id,
                            e.target.checked ? { checked: true, ...bulk } : { checked: false },
                            p.discount
                          )
                        }
                        className="h-4 w-4 accent-ember"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-char bg-gradient-to-b from-[#f4f1ea] to-[#cdc7ba]">
                          {p.images[0] && (
                            <Image
                              src={p.images[0].url}
                              alt={p.images[0].alt}
                              fill
                              sizes="40px"
                              className="object-contain p-1"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-display text-sm uppercase tracking-wide text-bone">
                            {p.name}
                          </p>
                          <p className="font-mono text-[10px] tracking-[0.1em] text-bone/35">
                            {p.sku} · {factionName(p.faction)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-bone/70">
                      {formatPrice(p.price, p.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.type}
                        disabled={!row.checked}
                        onChange={(e) => setRow(p.id, { type: e.target.value as Row["type"] }, p.discount)}
                        className="border border-char bg-ink-2 px-2 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-bone/80 disabled:opacity-40"
                      >
                        <option value="percentage">Porcentaje</option>
                        <option value="fixed">Monto fijo</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step={1}
                        min={0}
                        disabled={!row.checked}
                        value={row.value === 0 ? "" : row.value}
                        onChange={(e) =>
                          setRow(
                            p.id,
                            { value: e.target.value === "" ? 0 : Number(e.target.value) },
                            p.discount
                          )
                        }
                        placeholder="0"
                        className={cn(
                          "w-20 border bg-ink-2 px-2 py-2 font-mono text-sm text-bone disabled:opacity-40",
                          errors.value ? "border-red-500" : "border-char"
                        )}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        disabled={!row.checked}
                        value={row.validFrom}
                        onChange={(e) => setRow(p.id, { validFrom: e.target.value }, p.discount)}
                        className={cn(
                          "border bg-ink-2 px-2 py-2 font-mono text-[11px] text-bone disabled:opacity-40",
                          errors.validFrom ? "border-red-500" : "border-char"
                        )}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        disabled={!row.checked}
                        value={row.validUntil}
                        onChange={(e) => setRow(p.id, { validUntil: e.target.value }, p.discount)}
                        className={cn(
                          "border bg-ink-2 px-2 py-2 font-mono text-[11px] text-bone disabled:opacity-40",
                          errors.validUntil ? "border-red-500" : "border-char"
                        )}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-display text-sm font-bold text-bone">
                        {formatPrice(preview, p.currency)}
                      </p>
                      {row.checked && (
                        <p className="font-mono text-[10px] tracking-[0.05em] text-bone/40">
                          {row.type === "fixed"
                            ? `Equivale a -${Math.round((amount / p.price) * 100)}%`
                            : `Equivale a -${formatPrice(amount, p.currency)}`}
                        </p>
                      )}
                      {row.checked && !active && (
                        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ember-2">
                          {row.validFrom && row.validFrom > new Date().toISOString().slice(0, 10)
                            ? "Programado"
                            : "Vencido"}
                        </p>
                      )}
                    </td>
                    {showCancel && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onCancel?.(p.id)}
                          title="Cancelar descuento"
                          aria-label="Cancelar descuento"
                          className={cn(
                            "inline-flex h-8 w-8 items-center justify-center border border-char text-bone/60 transition-colors",
                            "hover:border-red-400 hover:text-red-400"
                          )}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
