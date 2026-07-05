import { SITE } from "./config";
import { formatPrice } from "./utils";
import type { Combo, Product } from "./types";

/** Construye un deep link wa.me con mensaje prellenado (brief §9). */
export function waLink(text: string, phone: string = SITE.whatsapp) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function waProductLink(product: Product) {
  const url = `${SITE.url}/producto/${product.slug}`;
  const text = `Hola, me interesa "${product.name}" (${formatPrice(
    product.price,
    product.currency
  )}). Enlace: ${url}. ¿Sigue disponible?`;
  return waLink(text);
}

export function waReserveLink(product: Product) {
  const text = `Hola, quiero reservar "${product.name}" (lanzamiento próximo). ¿Cómo coordino?`;
  return waLink(text);
}

export function waComboLink(combo: Combo) {
  const url = `${SITE.url}/combo/${combo.slug}`;
  const text = `Hola, me interesa el combo "${combo.name}" (${formatPrice(
    combo.price,
    combo.currency
  )}). Enlace: ${url}. ¿Sigue disponible?`;
  return waLink(text);
}

/** Datos mínimos que el carrito necesita para armar el pedido. */
export interface OrderLine {
  name: string;
  sku: string;
  slug: string;
  price: number;
  currency: string;
  qty: number;
}

/**
 * Construye un único mensaje de WhatsApp con todo el carrito (brief §9).
 * Lista cada pieza con cantidad y subtotal, el total del pedido y un cierre
 * para coordinar pago y envío.
 */
export function waCartLink(items: OrderLine[]) {
  const currency = items[0]?.currency ?? SITE.currency;
  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);

  const lines = items.map((it, i) => {
    const qty = it.qty > 1 ? ` x${it.qty}` : "";
    return `${i + 1}. ${it.name} (${it.sku})${qty} — ${formatPrice(
      it.price * it.qty,
      it.currency
    )}\n   ${SITE.url}/producto/${it.slug}`;
  });

  const text =
    `Hola, quiero hacer un pedido en ${SITE.name}:\n\n` +
    `${lines.join("\n")}\n\n` +
    `Total: ${formatPrice(total, currency)}\n\n` +
    `¿Coordinamos el pago y el envío?`;

  return waLink(text);
}
