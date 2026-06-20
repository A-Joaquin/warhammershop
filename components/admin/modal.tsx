"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/** Modal centrado, con scroll interno y cierre por Escape / backdrop. */
export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-ink/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={
          "relative my-4 w-full border border-char bg-ink-2 shadow-2xl " +
          (size === "lg" ? "max-w-2xl" : "max-w-lg")
        }
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-char bg-ink-2 px-6 py-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-[0.08em] text-bone">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-bone/60 transition-colors hover:text-bone"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
