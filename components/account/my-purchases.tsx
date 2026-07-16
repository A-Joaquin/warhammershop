"use client";

/**
 * "Mis compras" — posventa del cliente. Lee sus ventas directo de Supabase
 * (RLS: `auth.uid() = user_id`) y deja confirmar la entrega / calificar el
 * producto vía las RPC `confirm_delivery` y `submit_product_review`.
 */

import { useCallback, useEffect, useState } from "react";
import { MapPin, Truck, Package } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { DeliveryStatus } from "@/lib/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { StarPicker, Stars } from "@/components/ui/stars";

interface PurchaseRow {
  id: string;
  product_id: string | null;
  product_name: string;
  sold_price: number | string;
  currency: string;
  sold_at: string;
  delivery_status: DeliveryStatus;
  shipping_department: string | null;
  shipping_note: string | null;
}

interface Purchase {
  id: string;
  productName: string;
  soldPrice: number;
  currency: string;
  soldAt: string;
  deliveryStatus: DeliveryStatus;
  shippingDepartment?: string;
  shippingNote?: string;
}

interface ReviewRow {
  sale_id: string;
  rating: number;
  comment: string | null;
  hidden: boolean;
}

export function MyPurchases({ userId }: { userId: string }) {
  const sb = getSupabaseBrowser();
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [reviews, setReviews] = useState<
    Record<string, { rating: number; comment: string | null; hidden: boolean }>
  >({});

  const load = useCallback(async () => {
    const [p, r] = await Promise.all([
      sb
        .from("sales")
        .select(
          "id,product_id,product_name,sold_price,currency,sold_at,delivery_status,shipping_department,shipping_note"
        )
        .eq("user_id", userId)
        .order("sold_at", { ascending: false }),
      sb.from("product_reviews").select("sale_id,rating,comment,hidden").eq("user_id", userId),
    ]);
    if (p.error) console.error("MyPurchases load:", p.error.message);
    setPurchases(
      ((p.data ?? []) as unknown as PurchaseRow[]).map((row) => ({
        id: row.id,
        productName: row.product_name,
        soldPrice: Number(row.sold_price),
        currency: row.currency,
        soldAt: row.sold_at,
        deliveryStatus: row.delivery_status,
        shippingDepartment: row.shipping_department ?? undefined,
        shippingNote: row.shipping_note ?? undefined,
      }))
    );
    const map: Record<string, { rating: number; comment: string | null; hidden: boolean }> = {};
    for (const row of (r.data ?? []) as unknown as ReviewRow[]) {
      map[row.sale_id] = { rating: row.rating, comment: row.comment, hidden: row.hidden };
    }
    setReviews(map);
  }, [sb, userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (purchases === null) {
    return (
      <div className="mt-6 border border-char bg-ink-2 p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-bone/35">
          Cargando tus compras…
        </p>
      </div>
    );
  }

  if (purchases.length === 0) return null;

  return (
    <div className="mt-6 border border-char bg-ink-2 p-6">
      <h2 className="font-display text-lg font-bold uppercase tracking-[0.08em] text-bone">
        Mis compras
      </h2>
      <div className="mt-4 flex flex-col gap-4">
        {purchases.map((purchase) => (
          <PurchaseCard
            key={purchase.id}
            purchase={purchase}
            review={reviews[purchase.id]}
            onChanged={load}
          />
        ))}
      </div>
    </div>
  );
}

function PurchaseCard({
  purchase,
  review,
  onChanged,
}: {
  purchase: Purchase;
  review?: { rating: number; comment: string | null; hidden: boolean };
  onChanged: () => void;
}) {
  const sb = getSupabaseBrowser();
  const [confirming, setConfirming] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmDelivery = async () => {
    setConfirming(true);
    setError(null);
    const { error: rpcError } = await sb.rpc("confirm_delivery", { p_sale_id: purchase.id });
    setConfirming(false);
    if (rpcError) setError("No se pudo confirmar. Intenta de nuevo.");
    else onChanged();
  };

  const submitReview = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    setError(null);
    const { error: rpcError } = await sb.rpc("submit_product_review", {
      p_sale_id: purchase.id,
      p_rating: rating,
      p_comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (rpcError) setError("No se pudo enviar tu calificación.");
    else onChanged();
  };

  return (
    <div className="border border-char bg-ink p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display text-sm uppercase tracking-wide text-bone">
            {purchase.productName}
          </p>
          <p className="font-mono text-[10px] tracking-[0.1em] text-bone/40">
            {formatDate(purchase.soldAt)} · {formatPrice(purchase.soldPrice, purchase.currency)}
          </p>
        </div>
      </div>

      {purchase.deliveryStatus === "pendiente" && (
        <p className="mt-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-gold">
          <Package className="h-3.5 w-3.5" /> Preparando tu pedido
        </p>
      )}

      {purchase.deliveryStatus === "enviado" && (
        <div className="mt-3">
          {(purchase.shippingDepartment || purchase.shippingNote) && (
            <p className="mb-2 flex items-start gap-2 font-mono text-[11px] tracking-[0.06em] text-bone/55">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-bone/40" />
              {[purchase.shippingDepartment, purchase.shippingNote].filter(Boolean).join(" · ")}
            </p>
          )}
          <p className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-sky-300">
            <Truck className="h-3.5 w-3.5" /> En camino
          </p>
          <Button onClick={confirmDelivery} disabled={confirming} size="sm">
            {confirming ? "Confirmando…" : "Ya me llegó"}
          </Button>
        </div>
      )}

      {purchase.deliveryStatus === "entregado" && (
        <div className="mt-3">
          {review ? (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone/40">
                Tu calificación
              </p>
              <Stars value={review.rating} className="mt-1" />
              {review.comment && (
                <p className="mt-1.5 text-[13px] text-bone/60">{review.comment}</p>
              )}
              {review.hidden && (
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-bone/35">
                  No se muestra públicamente por ahora.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone/40">
                Califica esta pieza
              </p>
              <StarPicker value={rating} onChange={setRating} />
              <Textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cuéntanos qué te pareció (opcional)"
              />
              <Button
                onClick={submitReview}
                disabled={rating === 0 || submitting}
                size="sm"
                className="self-start"
              >
                {submitting ? "Enviando…" : "Enviar calificación"}
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 font-mono text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
