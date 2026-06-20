"use client";

import { cn } from "@/lib/utils";

/** Etiqueta + control en columna (primitiva de formularios del admin). */
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-bone/45">
        {label}
      </span>
      {children}
    </label>
  );
}

/** Select estilizado coherente con el tema del admin. */
export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full border border-char bg-ink-2 px-3 py-3 text-sm text-bone focus:border-ember/70 focus:outline-none",
        className
      )}
      {...props}
    />
  );
}

/** Checkbox con etiqueta. */
export function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-bone/60">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-ember"
      />
      {label}
    </label>
  );
}
