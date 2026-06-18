"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
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

  const shown = useMemo(
    () => images.filter((i) => i.kind === tab),
    [images, tab]
  );
  const current = shown[Math.min(active, shown.length - 1)] ?? images[0];

  const switchTab = (t: ImageKind) => {
    setTab(t);
    setActive(0);
  };

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
      <div className="relative aspect-[4/5] overflow-hidden border border-char bg-gradient-to-b from-[#f4f1ea] to-[#cdc7ba]">
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
        <span className="absolute left-4 top-4 border border-ink/15 bg-ink/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/60 backdrop-blur-sm">
          {tab === "official" ? "Render oficial" : "Pieza real"}
        </span>
      </div>

      {/* Miniaturas */}
      {shown.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-3">
          {shown.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={cn(
                "relative aspect-square overflow-hidden border bg-gradient-to-b from-[#f4f1ea] to-[#cdc7ba] transition-colors",
                i === active ? "border-ember" : "border-char hover:border-steel"
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
    </div>
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
