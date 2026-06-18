import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** ID corto y único (en backend es un uuid de Postgres). */
export function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Slug limpio a partir de un texto: 'Iron Warriors' → 'iron-warriors'. */
export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Inverso legible de un slug: 'iron-warriors' → 'Iron Warriors'. */
export function prettifySlug(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function formatPrice(value: number, currency = "BOB") {
  const symbol = currency === "BOB" ? "Bs" : currency === "USD" ? "$" : "";
  return `${symbol} ${value.toLocaleString("es-BO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
