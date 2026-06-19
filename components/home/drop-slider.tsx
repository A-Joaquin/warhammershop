"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Carrusel hero de banners de "drops", adaptado para imágenes panorámicas (1920x378).
 * Mantiene la relación de aspecto original para evitar recortes raros.
 */
export function DropSlider({
  drops,
  href,
  interval = 5000,
}: {
  drops: { title: string; image: string }[];
  href: string;
  interval?: number;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = drops.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setTimeout(() => setActive((p) => (p + 1) % count), interval);
    return () => clearTimeout(id);
  }, [active, paused, count, interval]);

  if (count === 0) return null;

  const go = (i: number) => setActive(((i % count) + count) % count);

  return (
    <div
      className="relative w-full overflow-hidden bg-ink"
      // CAMBIO AQUÍ: Forzamos la altura exacta basada en el ratio del banner (378 / 1920 = 19.6875vw)
      style={{ height: "19.6875vw", minHeight: "150px" }} 
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {drops.map((d, i) => (
        <Link
          key={d.image}
          href={href}
          aria-label={`Ver drop ${d.title}`}
          tabIndex={i === active ? 0 : -1}
          aria-hidden={i !== active}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-out",
            i === active ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <Image
            src={d.image}
            alt={d.title}
            fill
            priority={i === 0}
            sizes="100vw"
            // CAMBIO AQUÍ: Usamos contain si queremos asegurar que no se corte nada, 
            // aunque con el height correcto de arriba, "cover" o "contain" se verán casi igual y perfectos.
            className="object-cover object-center" 
          />
        </Link>
      ))}

      {count > 1 && (
        <>
          {/* Flechas */}
          <button
            type="button"
            onClick={() => go(active - 1)}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 border border-bone/20 bg-ink/50 p-2 text-bone/80 backdrop-blur-sm transition-colors hover:border-ember hover:text-ember md:left-6"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(active + 1)}
            aria-label="Banner siguiente"
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 border border-bone/20 bg-ink/50 p-2 text-bone/80 backdrop-blur-sm transition-colors hover:border-ember hover:text-ember md:right-6"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Puntos */}
          {/* Ajustado el bottom-3 para que en pantallas chicas no tape tanto contenido */}
          <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2.5 md:bottom-5">
            {drops.map((d, i) => (
              <button
                key={d.image}
                type="button"
                onClick={() => go(i)}
                aria-label={`Ir al banner ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "h-2 md:h-2.5 rounded-full transition-all",
                  i === active
                    ? "w-6 md:w-8 bg-ember"
                    : "w-2 md:w-2.5 bg-bone/50 hover:bg-bone"
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}