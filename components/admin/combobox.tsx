"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Combobox renderizado por la app (no el `datalist` nativo del navegador):
 * permite **elegir una opción existente o escribir una nueva**. Muestra un
 * desplegable estilizado con las coincidencias y, si lo escrito no existe, una
 * opción para crearlo. La opción nueva se materializa cuando el formulario que
 * lo usa la guarda. Se usa para facción/marca y categorías.
 */
export function ComboBox({
  value,
  onChange,
  options,
  placeholder = "Escribe o elige…",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera del combobox.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const q = value.trim().toLowerCase();
  const matches = q
    ? options.filter((c) => c.toLowerCase().includes(q))
    : options;
  const exists = options.some((c) => c.toLowerCase() === q);
  const showCreate = q.length > 0 && !exists;

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setHighlight(-1);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setHighlight(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setHighlight((h) => Math.min(h + 1, matches.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              if (open && highlight >= 0 && matches[highlight]) {
                e.preventDefault();
                pick(matches[highlight]);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          className={cn(
            "w-full border border-char bg-ink-2 px-3 py-3 pr-9 text-sm text-bone placeholder:text-bone/35",
            "focus:border-ember/70 focus:outline-none"
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Mostrar opciones"
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-bone/40 transition-colors hover:text-bone"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      {open && (matches.length > 0 || showCreate) && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto border border-char bg-ink-2 shadow-2xl"
        >
          {showCreate && (
            <li>
              <button
                type="button"
                // onMouseDown para no perder el foco antes del click.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(value.trim())}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-[0.1em] text-ember transition-colors hover:bg-ember/10"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                Crear “{value.trim()}”
              </button>
            </li>
          )}
          {matches.map((c, i) => {
            const selected = c.toLowerCase() === q;
            return (
              <li key={c}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(c)}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                    i === highlight ? "bg-bone/10 text-bone" : "text-bone/70",
                    selected && "text-ember"
                  )}
                >
                  <span className="truncate">{c}</span>
                  {selected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
