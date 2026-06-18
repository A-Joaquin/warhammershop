import type { Faction } from "../types";
import { prettifySlug } from "../utils";

/* ============================================================
   Catálogo curado de FACCIONES de producto (ejércitos: Space
   Marines, Necrons…) usado para nombres/acentos por defecto en el
   front. Las facciones reales y dinámicas viven en Supabase (tabla
   `factions`); esto es solo el respaldo curado + helpers.
   ============================================================ */

export const FACTIONS: Faction[] = [
  {
    slug: "space-marines",
    name: "Adeptus Astartes",
    accent: "#1c1c1c",
    blurb: "Los Ángeles de la Muerte del Emperador.",
  },
  {
    slug: "necrons",
    name: "Necrons",
    accent: "#3ba776",
    blurb: "Dinastías eternas que despiertan del sueño.",
  },
  {
    slug: "tyranids",
    name: "Tyránidos",
    accent: "#7c4dff",
    blurb: "La Gran Devoradora avanza, hambrienta.",
  },
  {
    slug: "chaos",
    name: "Caos",
    accent: "#b3001b",
    blurb: "La traición que arde en la Disformidad.",
  },
  {
    slug: "astra-militarum",
    name: "Astra Militarum",
    accent: "#6b7c3f",
    blurb: "El martillo incontable de la Humanidad.",
  },
  {
    slug: "aeldari",
    name: "Aeldari",
    accent: "#1f7a8c",
    blurb: "El arte mortal de una raza moribunda.",
  },
];

export function factionName(slug: string) {
  // Las facciones nuevas (marcas no-Warhammer) pueden no estar en la lista
  // curada: caemos a un nombre legible derivado del slug.
  return FACTIONS.find((f) => f.slug === slug)?.name ?? prettifySlug(slug);
}

export function factionAccent(slug: string) {
  return FACTIONS.find((f) => f.slug === slug)?.accent ?? "#46535b";
}
