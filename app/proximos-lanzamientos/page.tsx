import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CalendarClock, ArrowUpRight } from "lucide-react";
import { PageIntro, Eyebrow } from "@/components/section";
import { ReservationForm } from "@/components/reservation-form";
import { getComingSoon } from "@/lib/catalog";
import { factionName } from "@/lib/data/factions";
import { formatPrice, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Próximos lanzamientos",
  description:
    "Reserva las próximas incorporaciones al armerío. Sin compromiso, coordinamos por WhatsApp cuando lleguen.",
};

// ISR: refresca la lista de lanzamientos cada minuto.
export const revalidate = 60;

export default async function LanzamientosPage() {
  const items = await getComingSoon();

  return (
    <>
      <PageIntro
        eyebrow="Próximamente"
        title="Reserva antes del despliegue"
        description="Estas piezas aún no aterrizan en el armerío. Reserva sin compromiso y serás el primero en saber cuando estén disponibles."
      />

      <div className="mx-auto max-w-[1500px] px-6 py-16 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_420px]">
          {/* Lista de lanzamientos */}
          <div>
            <Eyebrow>— En camino</Eyebrow>
            <h2 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight text-bone md:text-3xl">
              {items.length} lanzamientos próximos
            </h2>

            <div className="mt-8 space-y-4">
              {items.map((p) => (
                <Link
                  key={p.id}
                  href={`/producto/${p.slug}`}
                  className="group flex gap-5 border border-char bg-ink-2 p-4 transition-colors hover:border-ember/50"
                >
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden bg-gradient-to-b from-[#f4f1ea] to-[#cdc7ba]">
                    <Image
                      src={p.images[0].url}
                      alt={p.images[0].alt}
                      fill
                      sizes="96px"
                      className="object-contain p-2"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ember-2">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {p.releaseDate ? formatDate(p.releaseDate) : "Por confirmar"}
                    </div>
                    <h3 className="mt-1.5 font-display text-lg font-semibold uppercase leading-tight text-bone">
                      {p.name}
                    </h3>
                    <p className="font-mono text-[10px] tracking-[0.16em] text-bone/40">
                      {factionName(p.faction)}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="font-display text-lg font-bold text-bone">
                        {formatPrice(p.price, p.currency)}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-bone/50 group-hover:text-ember">
                        Detalle <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Formulario de reserva */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow>— Reserva tu pieza</Eyebrow>
            <h2 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight text-bone md:text-3xl">
              Aparta sin compromiso
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-bone/55">
              Déjanos tus datos y te avisamos apenas llegue. Sin pagos por
              adelantado.
            </p>
            <div className="mt-6">
              <ReservationForm products={items} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
