"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_LINKS, SITE } from "@/lib/config";
import { waLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/whatsapp-button";
import { CartButton } from "@/components/cart/cart-button";
import { AccountMenu } from "@/components/account/account-menu";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const onHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  // Sobre el hero (home, sin scroll) el header es transparente.
  const transparent = onHome && !scrolled;

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-colors duration-300",
        transparent
          ? "bg-transparent border-b border-transparent"
          : "bg-ink/85 backdrop-blur-md border-b border-char"
      )}
    >
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-4 md:px-12 lg:px-16">
        <Link
          href="/"
          className="group flex flex-col leading-none"
          aria-label={SITE.name}
        >
          <span className="font-imperial text-base md:text-lg tracking-[0.14em] text-bone">
            EL ARSENAL
          </span>
          <span className="font-mono text-[9px] md:text-[10px] tracking-[0.42em] text-ember">
            DEL EMPERADOR
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-9">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative font-mono text-[12px] tracking-[0.22em] uppercase transition-colors",
                  active ? "text-bone" : "text-bone/55 hover:text-bone"
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute -bottom-1.5 left-0 h-px bg-ember transition-all duration-300",
                    active ? "w-full" : "w-0"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={waLink("Hola, vengo de la web del Arsenal del Emperador.")}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 border border-ember/70 px-4 py-2 font-mono text-[11px] tracking-[0.18em] text-bone transition-colors hover:bg-ember hover:text-ink"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            WHATSAPP
          </a>
          <AccountMenu />
          <CartButton />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
            aria-expanded={open}
            className="lg:hidden inline-flex items-center justify-center border border-steel/70 p-2 text-bone"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "lg:hidden overflow-hidden border-char bg-ink/97 backdrop-blur-md transition-[max-height,opacity] duration-300",
          open ? "max-h-96 opacity-100 border-b" : "max-h-0 opacity-0"
        )}
      >
        <nav className="flex flex-col px-6 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "border-b border-char/60 py-3 font-mono text-[13px] tracking-[0.18em] uppercase",
                pathname === link.href ? "text-ember" : "text-bone/70"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/cuenta"
            className={cn(
              "border-b border-char/60 py-3 font-mono text-[13px] tracking-[0.18em] uppercase",
              pathname === "/cuenta" ? "text-ember" : "text-bone/70"
            )}
          >
            Mi cuenta
          </Link>
          <a
            href={waLink("Hola, vengo de la web del Arsenal del Emperador.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 bg-[#25D366] px-4 py-3 font-mono text-[12px] tracking-[0.18em] uppercase text-ink"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Escríbenos
          </a>
        </nav>
      </div>
    </header>
  );
}
