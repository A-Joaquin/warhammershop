"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import type { ProductDiscount } from "@/lib/types";
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

function rowFromDiscount(d: ProductDiscount | undefined): Row {
  return {
    checked: Boolean(d),
    type: d?.type ?? "percentage",
    value: d?.value ?? 0,
    validFrom: d?.validFrom ?? "",
    validUntil: d?.validUntil ?? "",
  };
}

export default function AdminDiscountsPage() {
  const { products, setProductDiscount } = useAdminStore();
  const [query, setQuery] = useState("");
  const [faction, setFaction] = useState("");
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bulk, setBulk] = useState<Omit<Row, "checked">>({
    type: "percentage",
    value: 0,
    validFrom: "",
    validUntil: "",
  });

  const getRow = (id: string, discount: ProductDiscount | undefined): Row =>
    rows[id] ?? rowFromDiscount(discount);

  const setRow = (id: string, patch: Partial<Row>, discount: ProductDiscount | undefined) =>
    setRows((r) => ({ ...r, [id]: { ...getRow(id, discount), ...patch } }));

  // Sincroniza en vivo: cada vez que cambia el lote, se aplica a todas las filas ya tildadas.
  useEffect(() => {
    setRows((r) => {
      const next = { ...r };
      for (const p of products) {
        const current = next[p.id] ?? rowFromDiscount(p.discount);
        if (current.checked) {
          next[p.id] = { ...current, ...bulk };
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulk]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (faction && p.faction !== faction) return false;
      if (q && !`${p.name} ${p.sku}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, query, faction]);

  const save = async () => {
    setError(null);
    const entries = Object.entries(rows);
    for (const [id, row] of entries) {
      if (row.checked) {
        if (row.type === "percentage" && (row.value <= 0 || row.value > 100)) {
          return setError("El porcentaje debe estar entre 1 y 100.");
        }
        const product = products.find((p) => p.id === id);
        if (row.type === "fixed" && (row.value <= 0 || (product && row.value >= product.price))) {
          return setError("El monto fijo debe ser mayor a 0 y menor al precio del producto.");
        }
        if (row.validFrom && row.validUntil && row.validFrom > row.validUntil) {
          return setError('"Vigente desde" no puede ser posterior a "vigente hasta".');
        }
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

      {error && (
        <p className="mb-4 font-mono text-[11px] text-red-400">{error}</p>
      )}

      <div className="mb-5 border border-char bg-ink-2 p-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-bone/40">
          Aplicar en lote a los productos ya tildados
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-bone/40">
              Tipo
            </span>
            <select
              value={bulk.type}
              onChange={(e) => setBulk((b) => ({ ...b, type: e.target.value as Row["type"] }))}
              className="border border-char bg-ink px-2 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-bone/80"
            >
              <option value="percentage">Porcentaje</option>
              <option value="fixed">Monto fijo</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-bone/40">
              Valor
            </span>
            <input
              type="number"
              step={1}
              min={0}
              value={bulk.value === 0 ? "" : bulk.value}
              onChange={(e) =>
                setBulk((b) => ({ ...b, value: e.target.value === "" ? 0 : Number(e.target.value) }))
              }
              placeholder="0"
              className="w-24 border border-char bg-ink px-2 py-2 font-mono text-sm text-bone"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-bone/40">
              Vigente desde
            </span>
            <input
              type="date"
              value={bulk.validFrom}
              onChange={(e) => setBulk((b) => ({ ...b, validFrom: e.target.value }))}
              className="border border-char bg-ink px-2 py-2 font-mono text-[11px] text-bone"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-bone/40">
              Vigente hasta
            </span>
            <input
              type="date"
              value={bulk.validUntil}
              onChange={(e) => setBulk((b) => ({ ...b, validUntil: e.target.value }))}
              className="border border-char bg-ink px-2 py-2 font-mono text-[11px] text-bone"
            />
          </label>
        </div>
      </div>

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

      <Panel className="overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-5 py-16 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-bone/35">
            Sin resultados.
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
                  <th className="px-4 py-3 font-normal">Vigente desde</th>
                  <th className="px-4 py-3 font-normal">Vigente hasta</th>
                  <th className="px-4 py-3 text-right font-normal">Precio final</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
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
                  const amount = discountAmount({ price: p.price, discount: previewDiscount });
                  const active = isDiscountActive(previewDiscount);

                  return (
                    <tr
                      key={p.id}
                      className="border-b border-char/60 last:border-0 hover:bg-bone/[0.02]"
                    >
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
                          onChange={(e) =>
                            setRow(p.id, { type: e.target.value as Row["type"] }, p.discount)
                          }
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
                          className="w-20 border border-char bg-ink-2 px-2 py-2 font-mono text-sm text-bone disabled:opacity-40"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          disabled={!row.checked}
                          value={row.validFrom}
                          onChange={(e) => setRow(p.id, { validFrom: e.target.value }, p.discount)}
                          className="border border-char bg-ink-2 px-2 py-2 font-mono text-[11px] text-bone disabled:opacity-40"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          disabled={!row.checked}
                          value={row.validUntil}
                          onChange={(e) => setRow(p.id, { validUntil: e.target.value }, p.discount)}
                          className="border border-char bg-ink-2 px-2 py-2 font-mono text-[11px] text-bone disabled:opacity-40"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-display text-sm font-bold text-bone">
                          {formatPrice(preview, p.currency)}
                        </p>
                        {row.checked && active && (
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
