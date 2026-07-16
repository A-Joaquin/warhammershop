"use client";

import Link from "next/link";
import {
  Boxes,
  Receipt,
  CalendarClock,
  Rocket,
  ArrowUpRight,
  TrendingUp,
  Star,
} from "lucide-react";
import { useAdminStore } from "@/lib/contexts/admin-store";
import { formatPrice, formatDate } from "@/lib/utils";
import { PageHeader, Panel, SALE_CHANNEL_LABEL, ReservationStatusBadge } from "@/components/admin/admin-ui";

export default function AdminDashboard() {
  const { stats, sales, reservations } = useAdminStore();

  const recentSales = [...sales]
    .sort((a, b) => b.soldAt.localeCompare(a.soldAt))
    .slice(0, 5);
  const pending = reservations
    .filter((r) => r.status === "pendiente")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Resumen del Arsenal del Emperador"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          icon={Boxes}
          label="Disponibles"
          value={stats.available}
          href="/admin/productos"
        />
        <Stat
          icon={TrendingUp}
          label="Vendidos del mes"
          value={stats.soldThisMonthCount}
          hint={`${formatPrice(stats.soldThisMonthAmount)} · ${formatPrice(
            stats.soldThisMonthProfit
          )} gan.`}
          href="/admin/estadisticas"
        />
        <Stat
          icon={CalendarClock}
          label="Reservas pendientes"
          value={stats.pendingReservations}
          href="/admin/reservas"
          highlight={stats.pendingReservations > 0}
        />
        <Stat
          icon={Rocket}
          label="Próximos lanzamientos"
          value={stats.comingSoon}
          href="/admin/lanzamientos"
        />
        <Stat
          icon={Star}
          label="Reseñas bajas sin revisar"
          value={stats.lowReviewsUnseen}
          href="/admin/resenas"
          highlight={stats.lowReviewsUnseen > 0}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ventas recientes */}
        <Panel>
          <SectionTitle
            icon={Receipt}
            title="Ventas recientes"
            href="/admin/ventas"
          />
          {recentSales.length === 0 ? (
            <Empty text="Sin ventas registradas." />
          ) : (
            <ul className="divide-y divide-char">
              {recentSales.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm uppercase tracking-wide text-bone">
                      {s.productName}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-bone/40">
                      {formatDate(s.soldAt)} · {SALE_CHANNEL_LABEL[s.channel]}
                    </p>
                  </div>
                  <span className="font-display text-sm font-bold text-bone">
                    {formatPrice(s.soldPrice, s.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Reservas pendientes */}
        <Panel>
          <SectionTitle
            icon={CalendarClock}
            title="Reservas pendientes"
            href="/admin/reservas"
          />
          {pending.length === 0 ? (
            <Empty text="No hay reservas pendientes." />
          ) : (
            <ul className="divide-y divide-char">
              {pending.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm uppercase tracking-wide text-bone">
                      {r.customerName}
                    </p>
                    <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-bone/40">
                      {r.productName}
                    </p>
                  </div>
                  <ReservationStatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  href,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  hint?: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "group border bg-ink-2 p-5 transition-colors hover:border-ember/50 " +
        (highlight ? "border-ember/40" : "border-char")
      }
    >
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-ember" />
        <ArrowUpRight className="h-4 w-4 text-bone/30 transition-colors group-hover:text-ember" />
      </div>
      <p className="mt-4 font-display text-3xl font-bold text-bone">{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-bone/45">
        {label}
      </p>
      {hint && (
        <p className="mt-1 font-mono text-[11px] tracking-[0.1em] text-ember-2">
          {hint}
        </p>
      )}
    </Link>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-char px-5 py-3.5">
      <span className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.1em] text-bone">
        <Icon className="h-4 w-4 text-ember" />
        {title}
      </span>
      <Link
        href={href}
        className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone/40 transition-colors hover:text-ember"
      >
        Ver todo
      </Link>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="px-5 py-10 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-bone/35">
      {text}
    </p>
  );
}
