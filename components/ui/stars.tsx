"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Estrellas 1-5, solo lectura. */
export function Stars({
  value,
  size = "sm",
  className,
}: {
  value: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const px = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(px, n <= Math.round(value) ? "fill-ember text-ember" : "text-bone/25")}
        />
      ))}
    </div>
  );
}

/** Estrellas 1-5, interactivas (para calificar). */
export function StarPicker({
  value,
  onChange,
  size = "md",
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const px = size === "md" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star className={cn(px, n <= value ? "fill-ember text-ember" : "text-bone/25")} />
        </button>
      ))}
    </div>
  );
}
