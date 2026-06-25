/**
 * Departamentos de Bolivia (el cliente elige el suyo al registrarse).
 *
 * Se guarda el `name` tal cual en `profiles.department`. Sirve para coordinar
 * envíos a todo el país por WhatsApp.
 */
export const DEPARTMENTS = [
  "La Paz",
  "Santa Cruz",
  "Cochabamba",
  "Oruro",
  "Potosí",
  "Chuquisaca",
  "Tarija",
  "Beni",
  "Pando",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export function isDepartment(value: string | undefined): value is Department {
  return !!value && (DEPARTMENTS as readonly string[]).includes(value);
}
