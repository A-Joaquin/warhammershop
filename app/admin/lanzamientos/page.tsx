"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Rocket, CheckCircle2, Users } from "lucide-react";
import type { Product } from "@/lib/types";
import { useAdminStore, type ProductInput } from "@/lib/contexts/admin-store";
import { factionName } from "@/lib/data/factions";
import { formatPrice, formatDate } from "@/lib/utils";
import { PageHeader, Panel } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/admin/modal";
import { ProductForm } from "@/components/admin/product-form";

/** Convierte un Product en ProductInput (para reusar updateProduct). */
function toInput(p: Product): ProductInput {
  const { id: _id, ...rest } = p;
  void _id;
  return { ...rest, releaseDate: p.releaseDate ?? "" };
}

type Dialog = { type: "create" } | { type: "edit"; product: Product } | null;

export default function AdminLaunchesPage() {
  const {
    products,
    categories,
    factions,
    reservations,
    createProduct,
    updateProduct,
  } = useAdminStore();
  const [dialog, setDialog] = useState<Dialog>(null);

  const launches = useMemo(
    () =>
      products
        .filter((p) => p.status === "coming_soon")
        .sort((a, b) => (a.releaseDate ?? "").localeCompare(b.releaseDate ?? "")),
    [products]
  );

  const reservationsFor = (productId: string) =>
    reservations.filter((r) => r.productId === productId).length;

  const publish = (p: Product) => {
    if (
      window.confirm(
        `¿Publicar "${p.name}" como disponible? Saldrá de próximos lanzamientos.`
      )
    ) {
      updateProduct(p.id, {
        ...toInput(p),
        status: "available",
        isPreorder: false,
        releaseDate: undefined,
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="Lanzamientos"
        subtitle={`${launches.length} próximos`}
        action={
          <Button onClick={() => setDialog({ type: "create" })}>
            <Plus className="h-4 w-4" /> Nuevo lanzamiento
          </Button>
        }
      />

      {launches.length === 0 ? (
        <Panel>
          <p className="px-5 py-16 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-bone/35">
            No hay próximos lanzamientos.
          </p>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {launches.map((p) => {
            const count = reservationsFor(p.id);
            return (
              <Panel key={p.id} className="flex gap-4 p-4">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden border border-char bg-gradient-to-b from-[#f4f1ea] to-[#cdc7ba]">
                  {p.images[0] && (
                    <Image
                      src={p.images[0].url}
                      alt={p.images[0].alt}
                      fill
                      sizes="80px"
                      className="object-contain p-1.5"
                    />
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ember">
                    <Rocket className="h-3.5 w-3.5" />
                    {p.releaseDate ? formatDate(p.releaseDate) : "Sin fecha"}
                  </div>
                  <p className="mt-1 truncate font-display text-base uppercase tracking-wide text-bone">
                    {p.name}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-bone/40">
                    {factionName(p.faction)} · {formatPrice(p.price, p.currency)}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-bone/50">
                      <Users className="h-3.5 w-3.5" />
                      {count} {count === 1 ? "reserva" : "reservas"}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => publish(p)}
                        title="Publicar como disponible"
                        className="inline-flex items-center gap-1 border border-char px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-bone/60 transition-colors hover:border-emerald-400 hover:text-emerald-300"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Publicar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDialog({ type: "edit", product: p })}
                        title="Editar"
                        aria-label="Editar"
                        className="inline-flex h-8 w-8 items-center justify-center border border-char text-bone/60 transition-colors hover:border-ember hover:text-ember"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <Modal
        open={dialog?.type === "create"}
        onClose={() => setDialog(null)}
        title="Nuevo lanzamiento"
        size="lg"
      >
        <ProductForm
          categories={categories}
          factions={factions}
          onSubmit={(input) => {
            createProduct({ ...input, status: "coming_soon", isPreorder: true });
            setDialog(null);
          }}
          onCancel={() => setDialog(null)}
        />
      </Modal>

      <Modal
        open={dialog?.type === "edit"}
        onClose={() => setDialog(null)}
        title="Editar lanzamiento"
        size="lg"
      >
        {dialog?.type === "edit" && (
          <ProductForm
            product={dialog.product}
            categories={categories}
            factions={factions}
            onSubmit={(input) => {
              updateProduct(dialog.product.id, input);
              setDialog(null);
            }}
            onCancel={() => setDialog(null)}
          />
        )}
      </Modal>
    </div>
  );
}
