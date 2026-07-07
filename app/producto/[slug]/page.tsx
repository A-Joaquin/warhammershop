import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Package, Tag, Boxes } from "lucide-react";
import { getProductBySlug, getAllProducts, getRelated } from "@/lib/catalog";
import { discountedPrice, isDiscountActive } from "@/lib/types";
import { factionName } from "@/lib/data/factions";
import { formatPrice, formatDate } from "@/lib/utils";
import { SITE } from "@/lib/config";
import { waProductLink, waReserveLink } from "@/lib/whatsapp";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { ProductCard } from "@/components/catalog/product-card";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ProductClickTracker } from "@/components/catalog/product-click-tracker";
import { StatusBadge, DiscountBadge, CONDITION_LABEL } from "@/components/catalog/status-badge";
import { Eyebrow } from "@/components/section";

// ISR: las fichas se prerenderan y se refrescan cada minuto.
export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const products = await getAllProducts();
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return []; // sin BD en build: se generan bajo demanda
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: `${product.name} · ${SITE.name}`,
      description: product.description,
      images: [{ url: product.images[0].url }],
    },
  };
}

const AVAILABILITY: Record<string, string> = {
  available: "https://schema.org/InStock",
  reserved: "https://schema.org/PreOrder",
  sold: "https://schema.org/SoldOut",
  coming_soon: "https://schema.org/PreOrder",
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelated(product);
  const isComingSoon = product.status === "coming_soon";
  const isSold = product.status === "sold";
  const hasDiscount = isDiscountActive(product.discount);
  const finalPrice = hasDiscount ? discountedPrice(product) : product.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => `${SITE.url}${i.url}`),
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: "Warhammer 40.000" },
    offers: {
      "@type": "Offer",
      price: finalPrice,
      priceCurrency: product.currency,
      availability: AVAILABILITY[product.status],
      url: `${SITE.url}/producto/${product.slug}`,
    },
  };

  return (
    <article className="pt-28 md:pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Cuenta la visita a esta ficha (mock localStorage → Supabase) */}
      <ProductClickTracker productId={product.id} />

      <div className="mx-auto max-w-[1500px] px-6 md:px-12 lg:px-16">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-bone/40">
          <Link href="/" className="hover:text-ember">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/tienda" className="hover:text-ember">Catálogo</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/tienda?faction=${product.faction}`} className="hover:text-ember">
            {factionName(product.faction)}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-bone/70">{product.name}</span>
        </nav>

        {/* Detalle */}
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
          <ProductGallery images={product.images} name={product.name} sold={isSold} />

          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <Eyebrow>{factionName(product.faction)}</Eyebrow>
              <StatusBadge status={product.status} />
              {hasDiscount && product.discount && (
                <DiscountBadge discount={product.discount} price={product.price} currency={product.currency} />
              )}
            </div>

            <h1 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.98] tracking-tight text-bone md:text-5xl">
              {product.name}
            </h1>
            <p className="mt-2 font-mono text-[11px] tracking-[0.16em] text-bone/40">
              {product.line}
            </p>

            <div className="mt-6 flex items-end gap-4">
              {hasDiscount && (
                <span className="pb-1 font-mono text-lg text-bone/40 line-through">
                  {formatPrice(product.price, product.currency)}
                </span>
              )}
              <span className="font-display text-4xl font-bold text-bone">
                {formatPrice(finalPrice, product.currency)}
              </span>
              {isComingSoon && product.releaseDate && (
                <span className="pb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ember-2">
                  Lanza {formatDate(product.releaseDate)}
                </span>
              )}
            </div>

            <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-bone/65">
              {product.description}
            </p>

            {/* Ficha técnica */}
            <dl className="mt-7 grid grid-cols-2 gap-px overflow-hidden border border-char bg-char">
              <Spec icon={Tag} label="SKU" value={product.sku} />
              <Spec icon={Package} label="Condición" value={CONDITION_LABEL[product.condition]} />
              <Spec icon={Boxes} label="Stock" value={`${product.stockQty} ${product.stockQty === 1 ? "unidad" : "unidades"}`} />
              <Spec icon={Tag} label="Línea" value={product.line} />
            </dl>

            {/* CTA */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {isSold ? (
                <div className="flex-1 border border-char bg-ink-2 px-6 py-4 text-center font-display text-sm uppercase tracking-[0.14em] text-bone/50">
                  Pieza vendida
                </div>
              ) : isComingSoon ? (
                <>
                  <WhatsAppButton href={waReserveLink(product)} size="lg" className="flex-1">
                    Reservar por WhatsApp
                  </WhatsAppButton>
                  <Link
                    href="/proximos-lanzamientos"
                    className="inline-flex items-center justify-center border border-bone/30 px-6 py-4 font-display text-sm font-semibold uppercase tracking-[0.14em] text-bone transition-colors hover:border-bone hover:bg-bone/5"
                  >
                    Ver lanzamientos
                  </Link>
                </>
              ) : (
                <>
                  <AddToCartButton product={product} className="flex-1" />
                  <WhatsAppButton href={waProductLink(product)} size="lg" className="flex-1">
                    Comprar por WhatsApp
                  </WhatsAppButton>
                </>
              )}
            </div>
            <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-[0.1em] text-bone/35">
              Sin pago online. Cerramos la venta y coordinamos el envío directamente por WhatsApp.
            </p>
          </div>
        </div>

        {/* Relacionados */}
        {related.length > 0 && (
          <section className="mt-24 border-t border-char pt-16">
            <Eyebrow>— Misma facción</Eyebrow>
            <h2 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight text-bone md:text-3xl">
              Refuerza tu destacamento
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}

function Spec({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-ink-2 px-4 py-3.5">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-bone/40">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 font-display text-sm uppercase tracking-wide text-bone">
        {value}
      </p>
    </div>
  );
}
