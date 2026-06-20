"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  Receipt,
  CalendarClock,
  Rocket,
  BarChart3,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldHalf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/lib/contexts/admin-auth";
import { useAdminStore } from "@/lib/contexts/admin-store";
import { AdminLogin } from "@/components/admin/admin-login";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/productos", label: "Productos", icon: Boxes },
  { href: "/admin/ventas", label: "Ventas", icon: Receipt },
  { href: "/admin/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/admin/reservas", label: "Reservas", icon: CalendarClock },
  { href: "/admin/lanzamientos", label: "Lanzamientos", icon: Rocket },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { ready, authed, logout } = useAdminAuth();
  const [mobileNav, setMobileNav] = useState(false);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-bone/40">
          Cargando panel…
        </span>
      </div>
    );
  }

  if (!authed) return <AdminLogin />;

  return (
    <div className="min-h-screen bg-ink text-bone lg:grid lg:grid-cols-[240px_1fr]">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:border-r lg:border-char lg:bg-ink-2">
        <SidebarContent onLogout={logout} />
      </aside>

      {/* Topbar móvil */}
      <header className="flex items-center justify-between border-b border-char bg-ink-2 px-5 py-3.5 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <ShieldHalf className="h-5 w-5 text-ember" />
          <span className="font-display text-sm font-bold uppercase tracking-[0.12em]">
            Arsenal · Admin
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileNav(true)}
          aria-label="Abrir menú"
          className="border border-steel/60 p-2 text-bone"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Drawer móvil */}
      {mobileNav && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            onClick={() => setMobileNav(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-char bg-ink-2">
            <div className="flex justify-end p-3">
              <button
                type="button"
                onClick={() => setMobileNav(false)}
                aria-label="Cerrar menú"
                className="text-bone/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              onLogout={logout}
              onNavigate={() => setMobileNav(false)}
            />
          </aside>
        </div>
      )}

      <main className="min-w-0 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}

function SidebarContent({
  onLogout,
  onNavigate,
}: {
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { stats } = useAdminStore();

  return (
    <div className="flex h-full flex-col">
      <div className="hidden items-center gap-2 px-5 py-6 lg:flex">
        <ShieldHalf className="h-6 w-6 text-ember" />
        <div className="flex flex-col leading-none">
          <span className="font-display text-sm font-bold uppercase tracking-[0.12em] text-bone">
            Arsenal
          </span>
          <span className="font-mono text-[9px] tracking-[0.3em] text-ember">
            ADMIN
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 lg:mt-2">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          const badge =
            item.href === "/admin/reservas" && stats.pendingReservations > 0
              ? stats.pendingReservations
              : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 font-display text-sm uppercase tracking-wide transition-colors",
                active
                  ? "bg-ember/12 text-ember"
                  : "text-bone/60 hover:bg-bone/5 hover:text-bone"
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              <span className="flex-1">{item.label}</span>
              {badge && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 font-mono text-[10px] font-bold text-ink">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-char p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-bone/50 transition-colors hover:text-bone"
        >
          <ExternalLink className="h-4 w-4" /> Ver tienda
        </Link>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-bone/50 transition-colors hover:text-ember"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}
