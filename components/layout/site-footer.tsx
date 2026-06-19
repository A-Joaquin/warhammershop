import Link from "next/link";
import { MapPin, Clock, Mail } from "lucide-react";
import { NAV_LINKS, SITE } from "@/lib/config";
import { waLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/whatsapp-button";

export function SiteFooter() {
  return (
    <footer className="border-t border-char bg-ink-2 panel-grain">
      <div className="mx-auto grid max-w-[1500px] gap-10 px-6 py-14 md:grid-cols-2 md:px-12 lg:grid-cols-4 lg:px-16">
        {/* Brand */}
        <div className="lg:col-span-1">
          <div className="font-imperial text-lg tracking-[0.12em] text-bone">
            EL ARSENAL
          </div>
          <div className="font-mono text-[10px] tracking-[0.42em] text-ember">
            DEL EMPERADOR
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-bone/55">
            {SITE.tagline}. Miniaturas originales y piezas de colección
            Warhammer&nbsp;40.000.
          </p>
        </div>

        {/* Nav */}
        <div>
          <h3 className="font-mono text-[11px] tracking-[0.24em] uppercase text-bone/40">
            Navegación
          </h3>
          <ul className="mt-4 space-y-2.5">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-bone/70 transition-colors hover:text-ember"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h3 className="font-mono text-[11px] tracking-[0.24em] uppercase text-bone/40">
            La Tienda
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-bone/70">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
              <span>{SITE.address}<br />{SITE.city}</span>
            </li>
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
              <span>{SITE.hours}</span>
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
              <a href={`mailto:${SITE.email}`} className="hover:text-ember">
                {SITE.email}
              </a>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div>
          <h3 className="font-mono text-[11px] tracking-[0.24em] uppercase text-bone/40">
            Pedidos
          </h3>
          <p className="mt-4 text-sm text-bone/60">
            Cerramos cada venta por WhatsApp. Escríbenos y coordinamos tu envío a
            todo el país.
          </p>
          <a
            href={waLink("Hola, quiero información sobre sus miniaturas.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 bg-[#25D366] px-5 py-3 font-display text-[13px] font-semibold uppercase tracking-[0.14em] text-ink transition-transform hover:-translate-y-px"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Escríbenos
          </a>
        </div>
      </div>

      <div className="border-t border-char">
        <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-2 px-6 py-5 md:flex-row md:px-12 lg:px-16">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-bone/35">
            © {new Date().getFullYear()} {SITE.name} · EST. M41 · IMPERIUM
          </p>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-bone/35">
            Envío nacional · Piezas originales
          </p>
        </div>
      </div>
    </footer>
  );
}
