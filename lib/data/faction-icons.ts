/**
 * Íconos disponibles para asignar a una facción del catálogo. Son los mismos
 * logos de las legiones (`public/legiones_logos/`). Se muestran en el selector
 * emergente del formulario de producto; el elegido se guarda en la facción.
 */
import { LEGIONS } from "./legions";

export interface FactionIcon {
  name: string;
  src: string;
}

export const FACTION_ICONS: FactionIcon[] = LEGIONS.filter((l) =>
  Boolean(l.logo)
).map((l) => ({ name: l.name, src: l.logo as string }));
