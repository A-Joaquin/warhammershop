"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

export function ComboGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const count = images.length;
  const activeIdx = Math.min(active, Math.max(0, count - 1));
  const current = images[activeIdx];

  const go = (delta: number) =>
    setActive((a) => (count ? (a + delta + count) % count : 0));

  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, count]);

  if (count === 0) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden border border-char bg-gradient-to-b from-[#f4f1ea] to-[#cdc7ba]">
        <div className="flex h-full items-center justify-center">
          <Boxes className="h-24 w-24 text-ink/25" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className="group relative aspect-[4/5] overflow-hidden border border-char bg-gradient-to-b from-[#f4f1ea] to-[#cdc7ba]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Image
          src={current}
          alt={name}
          fill
          priority
          sizes="(max-width:1024px) 100vw, 50vw"
          className="object-contain p-6"
        />

        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Ampliar imagen"
          className="absolute inset-0 cursor-zoom-in"
        />

        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Ver en grande"
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center border border-ink/15 bg-ink/10 text-ink/70 backdrop-blur-sm transition-colors hover:border-ink/40 hover:text-ink"
        >
          <Expand className="h-4 w-4" />
        </button>

        {count > 1 && (
          <>
            <NavArrow side="left" onClick={() => go(-1)} />
            <NavArrow side="right" onClick={() => go(1)} />
            <span className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 border border-ink/15 bg-ink/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.16em] text-ink/70 backdrop-blur-sm">
              {activeIdx + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-3">
          {images.map((url, i) => (
            <button
              key={url + i}
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={cn(
                "relative aspect-square overflow-hidden border bg-gradient-to-b from-[#f4f1ea] to-[#cdc7ba] transition-colors",
                i === activeIdx ? "border-ember" : "border-char hover:border-steel"
              )}
            >
              <Image src={url} alt="" fill sizes="120px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-label={`Galería de ${name}`}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center border border-bone/20 bg-ink/50 text-bone/80 transition-colors hover:border-ember hover:text-ember"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative h-[80vh] w-[92vw] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={current} alt={name} fill sizes="100vw" className="object-contain" />
          </div>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="Imagen anterior"
                className="absolute left-3 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-bone/20 bg-ink/50 text-bone/80 transition-colors hover:border-ember hover:text-ember md:left-6"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="Imagen siguiente"
                className="absolute right-3 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center border border-bone/20 bg-ink/50 text-bone/80 transition-colors hover:border-ember hover:text-ember md:right-6"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <span className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 border border-bone/20 bg-ink/50 px-3 py-1 font-mono text-[11px] tracking-[0.18em] text-bone/80">
                {activeIdx + 1} / {count}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function NavArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Imagen anterior" : "Imagen siguiente"}
      className={cn(
        "absolute top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-ink/15 bg-ink/10 text-ink/70 backdrop-blur-sm transition-colors hover:border-ink/40 hover:text-ink",
        side === "left" ? "left-3" : "right-3"
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
