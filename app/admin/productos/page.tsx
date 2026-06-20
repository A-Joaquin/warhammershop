"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, BadgeDollarSign, Search } from "lucide-react";
import type { Product, ProductStatus } from "@/lib/types";
import { useAdminStore, type ProductInput } from "@/lib/contexts/admin-store";
import { factionName, FACTIONS } from "@/lib/data/factions";
import { formatPrice, cn } from "@/lib/utils";
import { PageHeader, Panel } from "@/components/admin/admin-ui";
import { StatusBadge } from "@/components/catalog/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/admin/modal";
import { ProductForm } from "@/components/admin/product-form";
import { MarkSoldForm } from "@/components/admin/mark-sold-form";

const STATUS_OPTIONS: { value: "" | ProductStatus; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "available", label: "Disponible" },
  { value: "reserved", label: "Reservado" },
  { value: "coming_soon", label: "Próximo" },
  { value: "sold", label: "Vendido" },
];

type Dialog =
  | { type: "create" }
  | { type: "edit"; product: Product }
  | { type: "sold"; product: Product }
  | null;

export default function AdminProductsPage() {
  const {
    products,
    categories,
    factions,
    createProduct,
    updateProduct,
    deleteProduct,
    markSold,
  } = useAdminStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | ProductStatus>("");
  const [faction, setFaction] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (status && p.status !== status) return false;
      if (faction && p.faction !== faction) return false;
      if (
        q &&
        !`${p.name} ${p.sku} ${p.line} ${p.category ?? ""} ${p.category2 ?? ""}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [products, query, status, faction]);

  const onCreate = (input: ProductInput) => {
    createProduct(input);
    setDialog(null);
  };
  const onEdit = (id: string, input: ProductInput) => {
    updateProduct(id, input);
    setDialog(null);
  };
  const onSold = (id: string, input: Parameters<typeof markSold>[1]) => {
    markSold(id, input);
    setDialog(null);
  };
  const onDelete = (p: Product) => {
    if (window.confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`))
      deleteProduct(p.id);
  };

  return (
    <div>
      <PageHeader
        title="Productos"
        subtitle={`${products.length} piezas en inventario`}
        action={
          <Button onClick={() => setDialog({ type: "create" })}>
            <Plus className="h-4 w-4" /> Nuevo producto
          </Button>
        }
      />

      {/* Filtros */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bone/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, SKU o línea…"
            className="pl-10"
          />
        </div>
        <Select value={faction} onChange={(e) => setFaction(e.target.value)}>
          <option value="">Todas las facciones</option>
          {FACTIONS.map((f) => (
            <option key={f.slug} value={f.slug}>
              {f.name}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value as "" | ProductStatus)}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Tabla */}
      <Panel className="overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-5 py-16 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-bone/35">
            Sin resultados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-char font-mono text-[10px] uppercase tracking-[0.16em] text-bone/40">
                  <th className="px-4 py-3 font-normal">Producto</th>
                  <th className="px-4 py-3 font-normal">Facción</th>
                  <th className="px-4 py-3 font-normal">Precio</th>
                  <th className="px-4 py-3 font-normal">Estado</th>
                  <th className="px-4 py-3 font-normal">Stock</th>
                  <th className="px-4 py-3 text-right font-normal">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-char/60 last:border-0 hover:bg-bone/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden border border-char bg-gradient-to-b from-[#f4f1ea] to-[#cdc7ba]">
                          {p.images[0] && (
                            <Image
                              src={p.images[0].url}
                              alt={p.images[0].alt}
                              fill
                              sizes="44px"
                              className="object-contain p-1"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-display text-sm uppercase tracking-wide text-bone">
                            {p.name}
                          </p>
                          <p className="font-mono text-[10px] tracking-[0.1em] text-bone/35">
                            {p.sku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-bone/55">
                      {factionName(p.faction)}
                    </td>
                    <td className="px-4 py-3 font-display text-sm font-bold text-bone">
                      {formatPrice(p.price, p.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-bone/70">
                      {p.stockQty}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {p.status !== "sold" && (
                          <IconBtn
                            title="Marcar vendido"
                            onClick={() => setDialog({ type: "sold", product: p })}
                          >
                            <BadgeDollarSign className="h-4 w-4" />
                          </IconBtn>
                        )}
                        <IconBtn
                          title="Editar"
                          onClick={() => setDialog({ type: "edit", product: p })}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn title="Eliminar" onClick={() => onDelete(p)} danger>
                          <Trash2 className="h-4 w-4" />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Diálogos */}
      <Modal
        open={dialog?.type === "create"}
        onClose={() => setDialog(null)}
        title="Nuevo producto"
        size="lg"
      >
        <ProductForm
          categories={categories}
          factions={factions}
          onSubmit={onCreate}
          onCancel={() => setDialog(null)}
        />
      </Modal>

      <Modal
        open={dialog?.type === "edit"}
        onClose={() => setDialog(null)}
        title="Editar producto"
        size="lg"
      >
        {dialog?.type === "edit" && (
          <ProductForm
            product={dialog.product}
            categories={categories}
            factions={factions}
            onSubmit={(input) => onEdit(dialog.product.id, input)}
            onCancel={() => setDialog(null)}
          />
        )}
      </Modal>

      <Modal
        open={dialog?.type === "sold"}
        onClose={() => setDialog(null)}
        title="Registrar venta"
      >
        {dialog?.type === "sold" && (
          <MarkSoldForm
            product={dialog.product}
            categories={categories}
            onConfirm={(input) => onSold(dialog.product.id, input)}
            onCancel={() => setDialog(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center border border-char text-bone/60 transition-colors",
        danger ? "hover:border-red-400 hover:text-red-400" : "hover:border-ember hover:text-ember"
      )}
    >
      {children}
    </button>
  );
}

function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "border border-char bg-ink-2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.12em] text-bone/80 focus:border-ember/70 focus:outline-none",
        className
      )}
      {...props}
    />
  );
}
