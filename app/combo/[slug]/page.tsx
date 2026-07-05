import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getComboBySlug, getCombos } from "@/lib/catalog";
import { formatPrice } from "@/lib/utils";
import { SITE } from "@/lib/config";
import { waComboLink } from "@/lib/whatsapp";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ComboGallery } from "@/components/catalog/combo-gallery";
import { Eyebrow } from "@/components/section";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const combos = await getCombos();
    return combos.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const combo = await getComboBySlug(slug);
  if (!combo) return { title: "Combo no encontrado" };
  return {
    title: combo.name,
    description: combo.description,
    openGraph: {
      title: `${combo.name} · ${SITE.name}`,
      description: combo.description,
      images: combo.imageUrl ? [{ url: combo.imageUrl }] : undefined,
    },
  };
}

export default async function ComboPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const combo = await getComboBySlug(slug);
  if (!combo) notFound();

  const items = combo.items.filter((i) => i.product);
  const originalTotal = items.reduce(
    (sum, i) => sum + (i.product ? i.product.price * i.quantity : 0),
    0
  );
  const savings = originalTotal - combo.price;
  const isDiscount = savings > 0;
  const galleryImages = [combo.imageUrl, ...items.map((i) => i.product?.image)].filter(
    (u): u is string => Boolean(u)
  );

  return (
    <article className="pt-28 md:pt-32">
      <div className="mx-auto max-w-[1500px] px-6 md:px-12 lg:px-16">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-bone/40">
          <Link href="/" className="hover:text-ember">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/tienda" className="hover:text-ember">Catálogo</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-bone/70">{combo.name}</span>
        </nav>

        {/* Detalle */}
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
          <ComboGallery images={galleryImages} name={combo.name} />

          <div className="flex flex-col">
            <Eyebrow>— Combo</Eyebrow>

            <h1 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.98] tracking-tight text-bone md:text-5xl">
              {combo.name}
            </h1>

            <div className="mt-6 flex items-end gap-4">
              <span className="font-display text-4xl font-bold text-bone">
                {formatPrice(combo.price, combo.currency)}
              </span>
              {isDiscount && (
                <span className="pb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-emerald-400">
                  Ahorras {formatPrice(savings, combo.currency)}
                </span>
              )}
            </div>

            {combo.description && (
              <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-bone/65">
                {combo.description}
              </p>
            )}

            {/* Desglose por producto */}
            <div className="mt-7 border border-char">
              <p className="border-b border-char bg-ink-2 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-bone/45">
                Este combo incluye
              </p>
              <div className="divide-y divide-char">
                {items.map((it) => {
                  const p = it.product!;
                  const subtotal = p.price * it.quantity;
                  const share = originalTotal > 0 ? subtotal / originalTotal : 0;
                  const withDiscount = combo.price * share;
                  const discount = subtotal - withDiscount;
                  return (
                    <Link
                      key={it.productId}
                      href={`/producto/${p.slug}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-bone/[0.03]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm uppercase tracking-wide text-bone">
                          {p.name}
                          {it.quantity > 1 && (
                            <span className="text-bone/40"> ×{it.quantity}</span>
                          )}
                        </p>
                        <p className="font-mono text-[10px] tracking-[0.05em] text-bone/35">
                          {formatPrice(subtotal, p.currency)} → {formatPrice(withDiscount, p.currency)}
                        </p>
                      </div>
                      <span
                        className={
                          discount > 0
                            ? "shrink-0 font-mono text-xs text-emerald-400"
                            : "shrink-0 font-mono text-xs text-red-400"
                        }
                      >
                        -{formatPrice(discount, p.currency)}
                      </span>
                    </Link>
                  );
                })}
              </div>
              <div className="flex items-center justify-between border-t border-char bg-ink-2 px-4 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone/40">
                  Precio original: {formatPrice(originalTotal, combo.currency)}
                </span>
                <span
                  className={
                    isDiscount
                      ? "font-display text-sm font-bold text-emerald-400"
                      : "font-display text-sm font-bold text-red-400"
                  }
                >
                  {isDiscount ? "Ahorro" : "Diferencia"}: {formatPrice(savings, combo.currency)}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8">
              <WhatsAppButton href={waComboLink(combo)} size="lg" className="w-full sm:w-auto">
                Consultar este combo por WhatsApp
              </WhatsAppButton>
            </div>
            <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-[0.1em] text-bone/35">
              Sin pago online. Cerramos la venta y coordinamos el envío directamente por WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
