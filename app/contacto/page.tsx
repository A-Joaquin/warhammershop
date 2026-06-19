import type { Metadata } from "next";
import { MapPin, Clock, Mail } from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
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
                href={SITE.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center border border-char text-bone/60 transition-colors hover:border-ember hover:text-ember"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Mapa placeholder */}
          <div className="relative min-h-[340px] overflow-hidden border border-char bg-ink-2 panel-grain">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(80% 80% at 50% 30%, color-mix(in srgb, var(--color-ember) 18%, transparent) 0%, transparent 60%)",
              }}
            />
            <div className="relative flex h-full flex-col items-center justify-center p-8 text-center">
              <MapPin className="h-10 w-10 text-ember" />
              <p className="mt-4 font-display text-xl font-semibold uppercase tracking-wide text-bone">
                {SITE.city}
              </p>
              <p className="mt-1 max-w-xs text-sm text-bone/50">{SITE.address}</p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/35">
                Mapa interactivo · próximamente
              </p>
            </div>
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
