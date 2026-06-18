/**
 * Catálogo de LEGIONES (la "facción" que elige cada cliente al crear su cuenta).
 *
 * Es distinto de las facciones de producto del catálogo (`lib/data.ts`, que son
 * ejércitos: Space Marines, Necrons…). Aquí van los Capítulos/Legiones de los
 * Astartes a los que el usuario declara lealtad.
 *
 * Por ahora el "ícono" es un escudo generado con el color e iniciales de la
 * legión (ver `components/legion-badge.tsx`). Cuando lleguen los logos reales se
 * rellena el campo `logo` y el badge los usará automáticamente.
 */

export type Allegiance = "loyalist" | "traitor";

export interface Legion {
  id: string;
  name: string;
  accent: string; // color hex de la legión
  allegiance: Allegiance;
  motto?: string;
  logo?: string; // ruta al logo (futuro)
}

export const LEGIONS: Legion[] = [
  // — Leales —
  { id: "ultramarines", name: "Ultramarines", accent: "#2f5fb0", allegiance: "loyalist", motto: "Courage and Honour", logo: "/legiones_logos/ultramarines.png" },
  { id: "blood-angels", name: "Blood Angels", accent: "#b3001b", allegiance: "loyalist", motto: "Por el Sanguinius", logo: "/legiones_logos/blood-angels.png" },
  { id: "dark-angels", name: "Dark Angels", accent: "#1f4d2e", allegiance: "loyalist", motto: "Repent! For tomorrow you die", logo: "/legiones_logos/dark-angels.png" },
  { id: "space-wolves", name: "Space Wolves", accent: "#6f8390", allegiance: "loyalist", motto: "For Russ and the Allfather", logo: "/legiones_logos/space-wolves.png" },
  { id: "imperial-fists", name: "Imperial Fists", accent: "#e3b007", allegiance: "loyalist", motto: "Primarch-Progenitor", logo: "/legiones_logos/imperial-fists.png" },
  { id: "iron-hands", name: "Iron Hands", accent: "#3a3d42", allegiance: "loyalist", motto: "The flesh is weak", logo: "/legiones_logos/iron-hands.png" },
  { id: "salamanders", name: "Salamanders", accent: "#1f7a3d", allegiance: "loyalist", motto: "Into the fires of battle", logo: "/legiones_logos/salamanders.png" },
  { id: "raven-guard", name: "Raven Guard", accent: "#1b1b22", allegiance: "loyalist", motto: "Victorus aut Mortis", logo: "/legiones_logos/raven-guard.png" },
  { id: "white-scars", name: "White Scars", accent: "#c2453b", allegiance: "loyalist", motto: "For the Khan!", logo: "/legiones_logos/white-scars.png" },
  { id: "black-templars", name: "Black Templars", accent: "#17171b", allegiance: "loyalist", motto: "No pity, no remorse, no fear", logo: "/legiones_logos/black-templars.png" },
  { id: "grey-knights", name: "Grey Knights", accent: "#7f8a93", allegiance: "loyalist", motto: "Sigillite's chosen", logo: "/legiones_logos/grey-knights.png" },

  // — Traidoras —
  { id: "world-eaters", name: "World Eaters", accent: "#8a1014", allegiance: "traitor", motto: "Blood for the Blood God", logo: "/legiones_logos/world-eaters.png" },
  { id: "death-guard", name: "Death Guard", accent: "#6f7340", allegiance: "traitor", motto: "Por Nurgle", logo: "/legiones_logos/death-guard.png" },
  { id: "thousand-sons", name: "Thousand Sons", accent: "#16776b", allegiance: "traitor", motto: "All is dust", logo: "/legiones_logos/thousand-sons.png" },
  { id: "emperors-children", name: "Emperor's Children", accent: "#7a2d72", allegiance: "traitor", motto: "Por Slaanesh", logo: "/legiones_logos/emperors-children.png" },
  { id: "iron-warriors", name: "Iron Warriors", accent: "#52525a", allegiance: "traitor", motto: "Iron within, iron without", logo: "/legiones_logos/iron-warriors.png" },
  { id: "night-lords", name: "Night Lords", accent: "#26344f", allegiance: "traitor", motto: "Ave Dominus Nox", logo: "/legiones_logos/night-lords.png" },
  { id: "alpha-legion", name: "Alpha Legion", accent: "#1f7068", allegiance: "traitor", motto: "For the Emperor (?)", logo: "/legiones_logos/alpha-legion.png" },
  { id: "word-bearers", name: "Word Bearers", accent: "#6e1f1f", allegiance: "traitor", motto: "Por la Palabra", logo: "/legiones_logos/word-bearers.png" },
];

export function getLegion(id: string | undefined): Legion | undefined {
  if (!id) return undefined;
  return LEGIONS.find((l) => l.id === id);
}

/**
 * Devuelve la legión cuyo `id` coincide con un slug de facción del catálogo
 * (p. ej. una facción "ultramarines" creada en el panel). Sirve para mostrar
 * el logo de la legión en los filtros del catálogo.
 */
export function legionForSlug(slug: string | undefined): Legion | undefined {
  if (!slug) return undefined;
  return LEGIONS.find((l) => l.id === slug.toLowerCase());
}

/** Iniciales para el escudo placeholder (ej. "Blood Angels" → "BA"). */
export function legionInitials(name: string): string {
  const words = name.replace(/[^a-zA-Z\s]/g, "").trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
