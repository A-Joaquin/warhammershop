"use client";

import { useEffect, useState } from "react";
import { Palette, Check, RotateCcw } from "lucide-react";

/** Color de acento por defecto (el naranja de la marca). */
const DEFAULT = "#f54c26";

const PRESETS: { name: string; hex: string }[] = [
  { name: "Naranja", hex: "#f54c26" },
  { name: "Oro", hex: "#c9a24b" },
  { name: "Sangre", hex: "#c0271f" },
  { name: "Necrón", hex: "#3ba776" },
  { name: "Aeldari", hex: "#2f86c5" },
  { name: "Púrpura", hex: "#7c4dff" },
  { name: "Rosa", hex: "#e0408a" },
  { name: "Hueso", hex: "#cdbf9a" },
];

function lighten(hex: string, amt = 0.22) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amt);
  const to2 = (c: number) => c.toString(16).padStart(2, "0");
  return `#${to2(mix(r))}${to2(mix(g))}${to2(mix(b))}`;
}

/** Aplica el color a las variables CSS que usan TODAS las utilidades y glows. */
function applyAccent(hex: string) {
  const root = document.documentElement;
  root.style.setProperty("--color-ember", hex);
  root.style.setProperty("--color-ember-2", lighten(hex));
}

export function ThemeColorMenu() {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(DEFAULT);

  useEffect(() => {
    const saved = localStorage.getItem("arsenal-accent");
    if (saved) {
      setColor(saved);
      applyAccent(saved);
    }
  }, []);

  const pick = (hex: string) => {
    setColor(hex);
    applyAccent(hex);
    localStorage.setItem("arsenal-accent", hex);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end">
      {open && (
        <div className="mb-3 w-64 border border-char bg-ink-2/95 p-4 shadow-2xl backdrop-blur-md">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-bone/50">
            Color de acento
          </p>

          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.hex}
                type="button"
                onClick={() => pick(p.hex)}
                title={p.name}
                aria-label={p.name}
                className="relative h-9 w-full border border-char transition-transform hover:scale-105"
                style={{ background: p.hex }}
              >
                {color.toLowerCase() === p.hex.toLowerCase() && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-ink" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>

          <label className="mt-3 flex items-center justify-between border border-char bg-ink px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/55">
              Personalizado
            </span>
            <input
              type="color"
              value={color}
              onChange={(e) => pick(e.target.value)}
              className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0"
            />
          </label>

          <button
            type="button"
            onClick={() => pick(DEFAULT)}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-char py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-bone/60 transition-colors hover:border-ember hover:text-ember"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar naranja
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Cambiar color de acento"
        aria-expanded={open}
        className="flex h-12 w-12 items-center justify-center border border-ember/60 bg-ink-2 text-ember shadow-lg transition-colors hover:bg-ember hover:text-ink"
      >
        <Palette className="h-5 w-5" />
      </button>
    </div>
  );
}
