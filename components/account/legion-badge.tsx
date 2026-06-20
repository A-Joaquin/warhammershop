import Image from "next/image";
import { getLegion, legionInitials, type Legion } from "@/lib/data/legions";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: 52, text: "text-sm" },
  md: { box: 80, text: "text-lg" },
  lg: { box: 144, text: "text-3xl" },
  xl: { box: 208, text: "text-5xl" },
};

/**
 * Ícono de la legión del usuario. Hoy es un escudo con el color e iniciales de
 * la legión; cuando exista `legion.logo` muestra el logo real.
 */
export function LegionBadge({
  legion,
  size = "md",
  className,
}: {
  legion: Legion | string | undefined;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const l = typeof legion === "string" ? getLegion(legion) : legion;
  const { box, text } = SIZES[size];

  if (!l) {
    return (
      <span
        className={cn("inline-block border border-char bg-ink-2", className)}
        style={{ width: box, height: box }}
        aria-hidden
      />
    );
  }

  // Con logo: solo la imagen, sin fondo/borde/escudo detrás.
  if (l.logo) {
    return (
      <span
        title={l.name}
        aria-label={`Legión: ${l.name}`}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center",
          className
        )}
        style={{ width: box, height: box }}
      >
        <Image src={l.logo} alt={l.name} fill className="object-contain" />
      </span>
    );
  }

  // Sin logo: escudo placeholder con color e iniciales.
  return (
    <span
      title={l.name}
      aria-label={`Legión: ${l.name}`}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden border",
        className
      )}
      style={{
        width: box,
        height: box,
        background: l.accent,
        borderColor: l.accent,
        // ligero recorte tipo escudo
        clipPath:
          "polygon(50% 0, 100% 18%, 100% 70%, 50% 100%, 0 70%, 0 18%)",
      }}
    >
      <span
        className={cn("font-display font-bold tracking-wide text-bone", text)}
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
      >
        {legionInitials(l.name)}
      </span>
    </span>
  );
}
