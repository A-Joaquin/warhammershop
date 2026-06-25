import type { Metadata } from "next";
import Image from "next/image";
import { MapPin, Clock, Mail } from "lucide-react";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.08 24 18.09 24 12.07z" />
    </svg>
  );
}
import { PageIntro, Eyebrow } from "@/components/section";
import { SITE } from "@/lib/config";
import { waLink } from "@/lib/whatsapp";
import { WhatsAppButton, WhatsAppIcon } from "@/components/whatsapp-button";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Escríbenos por WhatsApp para coordinar tu compra o reserva. Ubicación, horarios y datos de contacto del Arsenal del Emperador.",
};

export default function ContactoPage() {
  return (
    <>
      <PageIntro
        eyebrow="Contacto"
        title="Coordina tu pedido"
        description="Cerramos cada venta por WhatsApp: respondemos dudas, confirmamos disponibilidad y coordinamos el envío. Sin pagos online, sin complicaciones."
      />

      <div className="mx-auto max-w-[1500px] px-6 py-16 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr]">
          {/* Datos */}
          <div>
            <Eyebrow>— Canal principal</Eyebrow>
            <h2 className="mt-3 font-display text-2xl font-bold uppercase tracking-tight text-bone md:text-3xl">
              Hablemos por WhatsApp
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-bone/55">
              Es la vía más rápida. Te atiende una persona real del hobby, no un
              bot. Escríbenos y te respondemos en horario de tienda.
            </p>

            <div className="mt-6">
              <WhatsAppButton
                href={waLink("Hola, quiero información sobre una miniatura.")}
                size="lg"
              >
                Abrir WhatsApp
              </WhatsAppButton>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden border border-char bg-char sm:grid-cols-2">
              <InfoCard icon={MapPin} label="Ubicación">
                {SITE.address}
                <br />
                {SITE.city}
              </InfoCard>
              <InfoCard icon={Clock} label="Horario">
                {SITE.hours}
              </InfoCard>
              <InfoCard icon={Mail} label="Correo">
                <a href={`mailto:${SITE.email}`} className="hover:text-ember">
                  {SITE.email}
                </a>
              </InfoCard>
              <InfoCard icon={WhatsAppIcon} label="WhatsApp">
                +{SITE.whatsapp.replace(/(\d{3})(\d{2})(\d+)/, "$1 $2 $3")}
              </InfoCard>
            </div>

            {/* Redes */}
            <div className="mt-8 flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-bone/40">
                Síguenos
              </span>
              <a
                href={SITE.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center border border-char text-bone/60 transition-colors hover:border-ember hover:text-ember"
                aria-label="Facebook"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Mapa: Bolivia con Cochabamba iluminada */}
          <div className="relative flex min-h-[340px] items-center justify-center overflow-hidden border border-char bg-ink-2 panel-grain p-6">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(80% 80% at 41% 54%, color-mix(in srgb, var(--color-ember) 22%, transparent) 0%, transparent 55%)",
              }}
            />
            <div className="relative aspect-square w-full max-w-[440px]">
              <Image
                src="/mapabolivia.png"
                alt="Mapa de Bolivia — Cochabamba, sede del Arsenal"
                fill
                sizes="(max-width:1024px) 90vw, 45vw"
                className="object-contain"
              />
              {/* Marcador iluminado de Cochabamba (origen, 41% / 54%) */}
              <div
                className="absolute h-3 w-3"
                style={{ left: "41%", top: "54%", transform: "translate(-50%,-50%)" }}
              >
                <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember/40 animate-ping" />
                <span
                  className="absolute inset-0 rounded-full bg-ember"
                  style={{ boxShadow: "0 0 14px 2px var(--color-ember)" }}
                />
              </div>
            </div>
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] text-bone/40">
              Tienda virtual · {SITE.city}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function InfoCard({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-ink p-6">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/40">
        <Icon className="h-4 w-4 text-ember" />
        {label}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-bone/75">{children}</p>
    </div>
  );
}
