import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Truck, MessageCircle, Sparkles } from "lucide-react";
import { IntroScroll } from "@/components/home/intro-scroll";
import { ProductCard } from "@/components/catalog/product-card";
import { DropSlider } from "@/components/home/drop-slider";
import { LegionMarquee } from "@/components/home/legion-marquee";
import { SectionHeading, Eyebrow } from "@/components/section";
import { getFeatured, getComingSoon, getByCategory, getFactions } from "@/lib/catalog";
import { legionForSlug } from "@/lib/data/legions";
import { DROPS, NEW_RELEASE_CATEGORY } from "@/lib/config";

// ISR: refresca destacados y lanzamientos cada minuto.
export const revalidate = 60;

const NEW_RELEASE_HREF = `/tienda?category=${encodeURIComponent(
  NEW_RELEASE_CATEGORY
)}`;

export default async function HomePage() {
  const featured = await getFeatured();
  const comingSoon = (await getComingSoon()).slice(0, 3);
  const newReleases = (await getByCategory(NEW_RELEASE_CATEGORY)).slice(0, 6);
  const factions = await getFactions();

  return (
    <>
      <IntroScroll />

      {/* ---------- Sellos de confianza ---------- */}
      <section className="border-y border-char bg-ink-2">
        <div className="mx-auto grid max-w-[1500px] grid-cols-2 divide-x divide-char md:grid-cols-4">
          {[
            { icon: ShieldCheck, label: "Piezas originales", sub: "100% auténticas" },
            { icon: Truck, label: "Envío nacional", sub: "A todo el país" },
            { icon: MessageCircle, label: "Compra por WhatsApp", sub: "Atención directa" },
            { icon: Sparkles, label: "Edición de colección", sub: "Piezas únicas" },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-3 px-6 py-6 md:px-8">
              <t.icon className="h-6 w-6 shrink-0 text-ember" />
              <div>
                <p className="font-display text-sm font-semibold uppercase tracking-wide text-bone">
                  {t.label}
                </p>
                <p className="font-mono text-[10px] tracking-[0.16em] text-bone/40">
                  {t.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Cinta de legiones ---------- */}
      <section className="border-b border-char bg-ink py-12 md:py-16">
        <div className="mx-auto mb-2 max-w-[1500px] px-6 md:px-12 lg:px-16">
          <SectionHeading
            eyebrow="Lealtades"
            title="Legiones y capítulos"
            align="center"
          />
        </div>
        <LegionMarquee />
      </section>

      {/* ---------- Destacados ---------- */}
      <section className="mx-auto max-w-[1500px] px-6 py-20 md:px-12 md:py-24 lg:px-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Vitrina destacada"
            title={<>Reliquias selectas<br />del armerío</>}
          />
          <Link
            href="/tienda"
            className="group inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-ember"
          >
            Ver catálogo completo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i === 0} />
          ))}
        </div>
      </section>

      {/* ---------- Drops (carrusel hero a todo el ancho) ---------- */}
      {DROPS.length > 0 && (
        <section className="border-y border-char">
          <DropSlider drops={DROPS} href={NEW_RELEASE_HREF} />

          {/* ---------- Próximos lanzamientos ---------- */}
          <div className="mx-auto max-w-[1500px] px-6 py-20 md:px-12 md:py-24 lg:px-16">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                eyebrow="Próximamente"
                title={<>Reserva antes<br />de que despliegue</>}
                description="Asegura las próximas incorporaciones al armerío. Reserva sin compromiso y coordinamos por WhatsApp cuando llegue."
              />
              <Link
                href="/proximos-lanzamientos"
                className="group inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-ember"
              >
                Ver lanzamientos
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {comingSoon.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>

          {newReleases.length > 0 && (
            <div className="mx-auto max-w-[1500px] px-6 py-20 md:px-12 md:py-24 lg:px-16">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <SectionHeading
                  eyebrow="Nuevo drop"
                  title={<>Acaba de<br />aterrizar</>}
                />
                <Link
                  href={NEW_RELEASE_HREF}
                  className="group inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-bone/60 transition-colors hover:text-ember"
                >
                  Ver nuevos lanzamientos
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {newReleases.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ---------- Facciones ---------- */}
      <section className="border-y border-char bg-ink-2 panel-grain">
        <div className="mx-auto max-w-[1500px] px-6 py-20 md:px-12 md:py-24 lg:px-16">
          <SectionHeading
            eyebrow="Explora por facción"
            title="Elige tu bando en la guerra eterna"
            align="center"
          />
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {factions.map((f) => {
              const logo = f.logo || legionForSlug(f.slug)?.logo;
              return (
                <Link
                  key={f.slug}
                  href={`/tienda?faction=${f.slug}`}
                  className="group relative flex flex-col items-center justify-center overflow-hidden border border-char bg-ink p-6 text-center transition-colors hover:border-ember/50"
                >
                  <span
                    className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                    style={{ background: f.accent }}
                  />
                  {logo ? (
                    <Image
                      src={logo}
                      alt=""
                      width={48}
                      height={48}
                      className="mb-3 h-12 w-12 object-contain"
                    />
                  ) : (
                    <span
                      className="mb-3 inline-block h-10 w-10 rounded-full border"
                      style={{ borderColor: f.accent, background: `${f.accent}22` }}
                    />
                  )}
                  <span className="font-display text-sm font-semibold uppercase tracking-wide text-bone">
                    {f.name}
                  </span>
                  {f.blurb && (
                    <span className="mt-1 font-mono text-[9px] leading-tight tracking-[0.1em] text-bone/40">
                      {f.blurb}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- CTA final ---------- */}
      <section className="relative overflow-hidden border-t border-char bg-ink-2">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 120% at 50% 0%, color-mix(in srgb, var(--color-ember) 16%, transparent) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
          <Eyebrow className="text-center">— Por el Emperador</Eyebrow>
          <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-bone md:text-6xl">
            El plástico es eterno
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-bone/55">
            Explora el catálogo completo o escríbenos directo. Cada pieza es única
            y la coordinamos contigo por WhatsApp.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/tienda"
              className="inline-flex items-center justify-center gap-2 bg-ember px-8 py-4 font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-ink transition-all hover:-translate-y-px glow-accent"
            >
              Explorar catálogo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contacto"
              className="inline-flex items-center justify-center gap-2 border border-bone/40 px-8 py-4 font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-bone transition-colors hover:border-bone hover:bg-bone/5"
            >
              Contacto
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Bandera: Bolivia + Warhammer ---------- */}
      <section className="relative border-t border-char bg-ink-2">
        <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-center px-6 md:flex-row md:px-12 lg:px-16">
          {/* La bandera se sale de su contenedor e invade el panel de texto. */}
          <div className="relative z-10 -mb-12 w-full max-w-2xl shrink-0 md:-mb-0 md:-mr-28 lg:-mr-40 lg:max-w-3xl">
            <Image
              src="/bandera.png"
              alt="Estandarte imperial con la bandera de Bolivia"
              width={1451}
              height={1084}
              sizes="(max-width: 768px) 100vw, 48rem"
              className="h-auto w-full object-contain drop-shadow-[0_12px_40px_rgba(0,0,0,0.65)]"
            />
          </div>
          {/* Panel de texto: la bandera lo traspasa por arriba / por la izquierda. */}
          <div className="relative w-full border border-char bg-ink px-6 pb-10 pt-16 text-center md:py-20 md:pl-32 md:text-left lg:pl-48">
            <Eyebrow className="md:text-left">— Desde Bolivia para la galaxia</Eyebrow>
            <h2 className="mt-4 font-gothic text-4xl uppercase leading-[1.05] tracking-wide text-bone md:text-6xl">
              Hobby boliviano,<br />gloria imperial
            </h2>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-bone/55 md:mx-0">
              Orgullosamente bolivianos y devotos del Emperador. Llevamos
              Warhammer 40.000 a cada rincón del país, alzando nuestro estandarte
              tricolor en la guerra eterna. Por Bolivia y por el Imperio.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
