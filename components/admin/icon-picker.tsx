"use client";

import Image from "next/image";
import { Ban, Check } from "lucide-react";
import { Modal } from "./modal";
import { FACTION_ICONS } from "@/lib/data/faction-icons";
import { cn } from "@/lib/utils";

/**
 * Ventana emergente para elegir el ícono de una facción. Muestra todos los
 * íconos disponibles (logos de legiones) en una grilla; al elegir uno se cierra.
 */
export function FactionIconPicker({
  open,
  value,
  onPick,
  onClose,
}: {
  open: boolean;
  value?: string;
  onPick: (src: string) => void;
  onClose: () => void;
}) {
  const choose = (src: string) => {
    onPick(src);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Elegir ícono de la facción" size="lg">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {/* Opción: sin ícono */}
        <button
          type="button"
          onClick={() => choose("")}
          className={cn(
            "flex aspect-square flex-col items-center justify-center gap-2 border p-3 text-center transition-colors",
            !value
              ? "border-ember bg-ember/10"
              : "border-char hover:border-steel"
          )}
        >
          <Ban className="h-8 w-8 text-bone/40" />
          <span className="font-mono text-[9px] uppercase tracking-wide text-bone/50">
            Sin ícono
          </span>
        </button>

        {FACTION_ICONS.map((ic) => {
          const selected = value === ic.src;
          return (
            <button
              key={ic.src}
              type="button"
              onClick={() => choose(ic.src)}
              title={ic.name}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center gap-2 border p-3 transition-colors",
                selected
                  ? "border-ember bg-ember/10"
                  : "border-char hover:border-steel"
              )}
            >
              {selected && (
                <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-ember" />
              )}
              <Image
                src={ic.src}
                alt={ic.name}
                width={64}
                height={64}
                className="h-14 w-14 object-contain"
              />
              <span className="line-clamp-1 font-mono text-[9px] uppercase tracking-wide text-bone/50">
                {ic.name}
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
