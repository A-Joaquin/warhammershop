import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Brush, ShieldCheck, Globe2, Heart } from "lucide-react";
import { PageIntro, Eyebrow } from "@/components/section";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "La Tienda",
  description:
    "El Arsenal del Emperador: miniaturas originales y piezas de colección Warhammer 40.000, pintadas y curadas con devoción imperial.",
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Originalidad",
    text: "Solo piezas auténticas. Cada miniatura es genuina, sin réplicas ni recasts.",
  },
  {
    icon: Brush,
    title: "Pintura de exposición",
    text: "Trabajo de pintura a nivel vitrina, listo para tu colección desde el primer día.",
  },
  {
    icon: Globe2,
    title: "Envío a todo el país",
    text: "Empaque seguro y coordinación directa para que tu pieza llegue intacta.",
  },
  {
    icon: Heart,
    title: "Atención de hobbyista",
    text: "Te atiende alguien que vive el hobby. Asesoría real por WhatsApp, sin bots.",
  },
];

export default function NosotrosPage() {
  return (
    <>
      <PageIntro
        eyebrow="La Tienda"
        title={<>Forjado por<br />y para hobbyistas</>}
        description="El Arsenal del Emperador nació de la obsesión por las miniaturas Warhammer 40.000: piezas originales, pintura cuidada y la convicción de que el plástico es eterno."
      />

      {/* Manifiesto */}
      <section className="mx-auto max-w-[1500px] px-6 py-16 md:px-12 md:py-20 lg:px-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>— Nuestra misión</Eyebrow>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-bone md:text-4xl">
              Cada miniatura es una reliquia
            </h2>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-bone/65">
              <p>
                Somos una tienda especializada en coleccionables del universo
                Warhammer 40.000. Curamos piezas únicas —desde escuadras de
                tropa hasta personajes épicos— y las preparamos para que ocupen
                el lugar de honor en tu vitrina.
              </p>
              <p>
                No usamos pasarelas de pago frías ni carritos impersonales. Aquí
                cada venta es una conversación: nos escribes, resolvemos tus
                dudas y coordinamos el envío contigo directamente por WhatsApp.
              </p>
              <p className="font-imperial text-lg text-ember">
                El plástico es eterno. Tu legión, también.
              </p>
            </div>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden border border-char bg-gradient-to-b from-[#f4f1ea] to-[#cdc7ba]">
            <Image
              src="/products/bt-01.jpg"
              alt="Miniatura Black Templar pintada a nivel de exposición"
              fill
              sizes="(max-width:1024px) 100vw, 50vw"
              className="object-contain p-8"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/80 to-transparent p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-bone/80">
                Black Templar · Pieza de colección
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="border-y border-char bg-ink-2 panel-grain">
        <div className="mx-auto max-w-[1500px] px-6 py-16 md:px-12 md:py-20 lg:px-16">
          <div className="grid grid-cols-1 gap-px overflow-hidden border border-char bg-char sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-ink p-7">
                <v.icon className="h-7 w-7 text-ember" />
                <h3 className="mt-4 font-display text-lg font-semibold uppercase tracking-wide text-bone">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-bone/55">
                  {v.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center md:py-24">
        <h2 className="font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-bone md:text-5xl">
          ¿Listo para reclutar?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-bone/55">
          Explora el armerío o escríbenos. Estamos en {SITE.city}.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/tienda"
            className="inline-flex items-center justify-center bg-ember px-8 py-4 font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-ink transition-all hover:-translate-y-px glow-accent"
          >
            Ver catálogo
          </Link>
          <Link
            href="/contacto"
            className="inline-flex items-center justify-center border border-bone/40 px-8 py-4 font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-bone transition-colors hover:border-bone hover:bg-bone/5"
          >
            Contacto
          </Link>
        </div>
      </section>
    </>
  );
}
