import Image from "next/image";
import Link from "next/link";
import { LEGIONS } from "@/lib/data/legions";

/**
 * Cinta infinita con los logos de todas las legiones. Animación pura CSS
 * (`.marquee-track` en globals.css): la pista lleva la lista duplicada y se
 * desplaza -50% en bucle. Se pausa al pasar el mouse y respeta
 * `prefers-reduced-motion`. Cada logo enlaza al catálogo filtrado por esa
 * legión (`/tienda?faction=<id>`).
 */
export function LegionMarquee({
  duration = 50,
}: {
  /** Segundos por vuelta completa. Más alto = más lento. */
  duration?: number;
}) {
  // Duplicamos la lista para que el loop no tenga costura.
  const reel = [...LEGIONS, ...LEGIONS];

  return (
    <div
      className="marquee group relative overflow-hidden py-8"
      style={{ ["--marquee-duration" as string]: `${duration}s` }}
      aria-label="Legiones y capítulos"
    >
      {/* Difuminado en los bordes para que la cinta entre y salga suave. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink to-transparent" />

      <div className="marquee-track">
        {reel.map((l, i) => (
          <Link
            key={`${l.id}-${i}`}
            href={`/tienda?faction=${l.id}`}
            title={l.name}
            aria-label={`Ver piezas de ${l.name}`}
            tabIndex={i < LEGIONS.length ? 0 : -1}
            className="mx-8 inline-flex h-36 w-36 shrink-0 items-center justify-center opacity-90 transition-transform duration-300 hover:scale-125 md:mx-12 md:h-44 md:w-44"
          >
            {l.logo && (
              <Image
                src={l.logo}
                alt={l.name}
                width={144}
                height={144}
                className="h-full w-full object-contain"
              />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
