"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImage, ImageKind } from "@/lib/types";

export function ProductGallery({
  images,
  name,
  sold = false,
}: {
  images: ProductImage[];
  name: string;
  sold?: boolean;
}) {
  const hasOfficial = images.some((i) => i.kind === "official");
  const hasStore = images.some((i) => i.kind === "store");
  const [tab, setTab] = useState<ImageKind>(hasOfficial ? "official" : "store");
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const shown = useMemo(
    () => images.filter((i) => i.kind === tab),
    [images, tab]
  );
  const count = shown.length;
  const activeIdx = Math.min(active, Math.max(0, count - 1));
  const current = shown[activeIdx] ?? images[0];

  const switchTab = (t: ImageKind) => {
    setTab(t);
    setActive(0);
  };

  // Avanza/retrocede dentro de la pestaña actual (con vuelta circular).
  const go = (delta: number) =>
    setActive((a) => (count ? (a + delta + count) % count : 0));

  // Swipe táctil (móvil) para la imagen principal y el lightbox.
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

  // Teclado + bloqueo de scroll mientras el lightbox está abierto.
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

  return (
    <div>
      {/* Pestañas oficiales / tienda */}
      <div className="mb-4 flex gap-2">
        {hasOfficial && (
          <TabButton active={tab === "official"} onClick={() => switchTab("official")}>
            Fotos oficiales
          </TabButton>
        )}
        {hasStore && (
          <TabButton active={tab === "store"} onClick={() => switchTab("store")}>
            Fotos de la tienda
          </TabButton>
        )}
      </div>

      {/* Imagen principal sobre panel de estudio */}
      <div
        className="group relative aspect-[4/5] overflow-hidden border border-char bg-gradient-to-b from-[#f4f1ea] to-[#cdc7ba]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {current && (
          <Image
            src={current.url}
            alt={current.alt}
            fill
            priority
            sizes="(max-width:1024px) 100vw, 50vw"
            className={cn("object-contain p-6", sold && "opacity-70 grayscale")}
          />
        )}

        <span className="pointer-events-none absolute left-4 top-4 border border-ink/15 bg-ink/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/60 backdrop-blur-sm">
          {tab === "official" ? "Render oficial" : "Pieza real"}
        </span>

        {/* Capa para ampliar (clic en la imagen) */}
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Ampliar imagen"
          className="absolute inset-0 cursor-zoom-in"
        />

        {/* Botón ampliar */}
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Ver en grande"
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center border border-ink/15 bg-ink/10 text-ink/70 backdrop-blur-sm transition-colors hover:border-ink/40 hover:text-ink"
        >
          <Expand className="h-4 w-4" />
        </button>

        {/* Flechas anterior / siguiente */}
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

      {/* Miniaturas */}
      {count > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-3">
          {shown.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={cn(
                "relative aspect-square overflow-hidden border bg-gradient-to-b from-[#f4f1ea] to-[#cdc7ba] transition-colors",
                i === activeIdx ? "border-ember" : "border-char hover:border-steel"
              )}
            >
              <Image
                src={img.url}
                alt={img.alt}
                fill
                sizes="120px"
                className="object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox / visor a pantalla completa */}
      {lightbox && current && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/95 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-label={`Galería de ${name}`}
        >
          {/* Cerrar */}
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center border border-bone/20 bg-ink/50 text-bone/80 transition-colors hover:border-ember hover:text-ember"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Imagen grande */}
          <div
            className="relative h-[80vh] w-[92vw] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current.url}
              alt={current.alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
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

function NavArrow({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors",
        active
          ? "border-ember bg-ember/10 text-ember"
          : "border-char text-bone/50 hover:border-steel hover:text-bone/80"
      )}
    >
      {children}
    </button>
  );
}
