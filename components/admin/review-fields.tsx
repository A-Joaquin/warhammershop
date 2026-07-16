"use client";

import { Input, Textarea } from "@/components/ui/input";
import { StarPicker } from "@/components/ui/stars";

/**
 * Campos controlados de "reseña aproximada del cliente": nombre + estrellas +
 * comentario. Lo usa tanto `MarkSoldForm` (al registrar la venta) como la
 * acción "Agregar reseña" del listado de ventas. Sin estado propio.
 */
export function ReviewFields({
  reviewerName,
  onReviewerNameChange,
  rating,
  onRatingChange,
  comment,
  onCommentChange,
}: {
  reviewerName: string;
  onReviewerNameChange: (v: string) => void;
  rating: number;
  onRatingChange: (v: number) => void;
  comment: string;
  onCommentChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/45">
          Nombre o apodo del cliente
        </span>
        <Input
          value={reviewerName}
          onChange={(e) => onReviewerNameChange(e.target.value)}
          placeholder="Ej. el nombre que dio al recoger su pedido"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/45">
          Calificación
        </span>
        <StarPicker value={rating} onChange={onRatingChange} />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/45">
          Comentario (opcional)
        </span>
        <Textarea
          rows={2}
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          placeholder="Lo que te dijo el cliente sobre la pieza"
        />
      </label>
    </div>
  );
}
