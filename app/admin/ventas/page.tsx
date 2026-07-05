"use client";

import { useMemo, useState } from "react";
import { Plus, Receipt, Search, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { useAdminStore } from "@/lib/contexts/admin-store";
import { factionName } from "@/lib/data/factions";
import { formatPrice, formatDate, cn } from "@/lib/utils";
import {
  PageHeader,
  Panel,
  SALE_CHANNEL_LABEL,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/admin/modal";
import { MarkSoldForm } from "@/components/admin/mark-sold-form";

export default function AdminSalesPage() {
  const { sales, products, categories, factions, markSold, hideSale } = useAdminStore();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [registering, setRegistering] = useState(false);
  const [picked, setPicked] = useState<Product | null>(null);
  const [pickQuery, setPickQuery] = useState("");
  const [pickFaction, setPickFaction] = useState("");

  const sellable = useMemo(() => {
    const q = pickQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (p.status === "sold") return false;
      if (pickFaction && p.faction !== pickFaction) return false;
      if (q && !`${p.name} ${p.sku}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, pickQuery, pickFaction]);

  const filtered = useMemo(() => {
    return [...sales]
      .filter((s) => {
        const day = s.soldAt.slice(0, 10);
        if (from && day < from) return false;
        if (to && day > to) return false;
        return true;
      })
      .sort((a, b) => b.soldAt.localeCompare(a.soldAt));
  }, [sales, from, to]);

  const total = filtered.reduce((a, s) => a + s.soldPrice, 0);

  const closeRegister = () => {
    setRegistering(false);
    setPicked(null);
    setPickQuery("");
    setPickFaction("");
  };

  return (
    <div>
      <PageHeader
        title="Ventas"
        subtitle="Registro e historial"
        action={
          <Button onClick={() => setRegistering(true)}>
            <Plus className="h-4 w-4" /> Registrar venta
          </Button>
        }
      />

      {/* Resumen + filtros de fecha */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <DateField label="Desde" value={from} onChange={setFrom} />
          <DateField label="Hasta" value={to} onChange={setTo} />
          {(from || to) && (
            <button
              type="button"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
              className="pb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ember/80 hover:text-ember"
            >
              Limpiar
            </button>
          )}
        </div>
        <div className="border border-char bg-ink-2 px-5 py-3 text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone/40">
            {filtered.length} ventas · total
          </p>
          <p className="font-display text-2xl font-bold text-bone">
            {formatPrice(total)}
          </p>
        </div>
      </div>

      <Panel className="overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-5 py-16 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-bone/35">
            Sin ventas en el rango.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-char font-mono text-[10px] uppercase tracking-[0.16em] text-bone/40">
                  <th className="px-4 py-3 font-normal">Producto</th>
                  <th className="px-4 py-3 font-normal">Fecha</th>
                  <th className="px-4 py-3 font-normal">Canal</th>
                  <th className="px-4 py-3 font-normal">Nota</th>
                  <th className="px-4 py-3 text-right font-normal">Precio</th>
                  <th className="px-4 py-3 text-right font-normal">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-char/60 last:border-0 hover:bg-bone/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <p className="font-display text-sm uppercase tracking-wide text-bone">
                        {s.productName}
                      </p>
                      <p className="font-mono text-[10px] tracking-[0.1em] text-bone/35">
                        {s.sku}
                        {[s.category, s.category2]
                          .filter(Boolean)
                          .map((c) => ` · ${c}`)
                          .join("")}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] tracking-[0.08em] text-bone/60">
                      {formatDate(s.soldAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-bone/55">
                        <Receipt className="h-3 w-3 text-ember" />
                        {SALE_CHANNEL_LABEL[s.channel]}
                      </span>
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-sm text-bone/45">
                      <span className="line-clamp-1">{s.buyerNote ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-display text-sm font-bold text-bone">
                      {formatPrice(s.soldPrice, s.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("¿Ocultar esta venta del listado?"))
                            hideSale(s.id);
                        }}
                        aria-label="Ocultar venta"
                        className="inline-flex h-9 w-9 items-center justify-center border border-char text-bone/50 transition-colors hover:border-red-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Registrar venta: elegir pieza → confirmar */}
      <Modal
        open={registering}
        onClose={closeRegister}
        title={picked ? "Registrar venta" : "Elegir pieza vendida"}
      >
        {!picked ? (
          <div className="flex flex-col gap-3">
            {/* Buscador por nombre/SKU + facción */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bone/40" />
                <Input
                  value={pickQuery}
                  onChange={(e) => setPickQuery(e.target.value)}
                  placeholder="Buscar por nombre o SKU…"
                  className="pl-10"
                  autoFocus
                />
              </div>
              <select
                value={pickFaction}
                onChange={(e) => setPickFaction(e.target.value)}
                aria-label="Filtrar por facción"
                className="border border-char bg-ink-2 px-3 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-bone/80 focus:border-ember/70 focus:outline-none"
              >
                <option value="">Todas las facciones</option>
                {factions.map((f) => (
                  <option key={f.slug} value={f.slug}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {sellable.length === 0 ? (
              <p className="py-8 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-bone/35">
                Sin piezas que coincidan.
              </p>
            ) : (
              <ul className="max-h-[50vh] divide-y divide-char overflow-y-auto">
                {sellable.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setPicked(p)}
                    className="flex w-full items-center justify-between gap-3 px-1 py-3 text-left transition-colors hover:bg-bone/5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm uppercase tracking-wide text-bone">
                        {p.name}
                      </p>
                      <p className="font-mono text-[10px] tracking-[0.1em] text-bone/35">
                        {p.sku} · {factionName(p.faction)}
                      </p>
                    </div>
                    <span className="font-display text-sm font-bold text-bone">
                      {formatPrice(p.price, p.currency)}
                    </span>
                  </button>
                </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <MarkSoldForm
            product={picked}
            categories={categories}
            onConfirm={(input) => {
              markSold(picked.id, input);
              closeRegister();
            }}
            onCancel={() => setPicked(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone/40">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "border border-char bg-ink-2 px-3 py-2.5 font-mono text-xs text-bone focus:border-ember/70 focus:outline-none"
        )}
      />
    </label>
  );
}
