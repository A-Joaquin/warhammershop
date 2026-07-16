import type { ProductRating, ProductReview } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Stars } from "@/components/ui/stars";
import { Eyebrow } from "@/components/section";

export function ProductReviews({
  rating,
  reviews,
}: {
  rating: ProductRating | null;
  reviews: ProductReview[];
}) {
  return (
    <section className="mt-24 border-t border-char pt-16">
      <Eyebrow>— Opiniones</Eyebrow>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-bone md:text-3xl">
          Lo que dicen los coleccionistas
        </h2>
        {rating && (
          <div className="flex items-center gap-2">
            <Stars value={rating.avg} size="md" />
            <span className="font-mono text-sm text-bone/60">
              {rating.avg.toFixed(1)} · {rating.count} {rating.count === 1 ? "reseña" : "reseñas"}
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.14em] text-bone/35">
          Sé el primero en calificar esta pieza.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className="border border-char bg-ink-2 p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-sm uppercase tracking-wide text-bone">
                  {r.reviewerName}
                </p>
                <span className="font-mono text-[10px] tracking-[0.1em] text-bone/35">
                  {formatDate(r.createdAt)}
                </span>
              </div>
              <Stars value={r.rating} className="mt-1.5" />
              {r.comment && (
                <p className="mt-2.5 text-[13px] leading-relaxed text-bone/65">{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
