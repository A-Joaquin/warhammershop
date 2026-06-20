"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  Wallet,
  Coins,
  Percent,
  Trophy,
  Tag,
  PieChart,
  Eye,
  ArrowLeftRight,
} from "lucide-react";
import { useAdminStore } from "@/lib/contexts/admin-store";
import { productCost, productCostUsd } from "@/lib/types";
import { formatPrice, cn } from "@/lib/utils";
import {
  PageHeader,
  Panel,
  SALE_CHANNEL_LABEL,
} from "@/components/admin/admin-ui";
import type { SaleChannel } from "@/lib/types";

export default function AdminStatsPage() {
  const { sales, stats, products } = useAdminStore();

  const data = useMemo(() => {
    const revenue = sales.reduce((a, s) => a + s.soldPrice, 0);
    const cost = sales.reduce((a, s) => a + s.cost, 0);
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    // Ranking por categoría: unidades (cuenta 1ª y 2ª) e ingresos (solo 1ª).
    const cats = new Map<string, { units: number; revenue: number }>();
    const bump = (name: string | undefined, rev: number) => {
      if (!name) return;
      const cur = cats.get(name) ?? { units: 0, revenue: 0 };
      cur.units += 1;
      cur.revenue += rev;
      cats.set(name, cur);
    };
    for (const s of sales) {
      bump(s.category, s.soldPrice);
      bump(s.category2, 0); // la 2ª suma unidades, no ingresos (evita doble conteo)
    }
    const categories = [...cats.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.units - a.units || b.revenue - a.revenue);

    // Ventas por canal.
    const channelMap = new Map<SaleChannel, { count: number; revenue: number }>();
    for (const s of sales) {
      const cur = channelMap.get(s.channel) ?? { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += s.soldPrice;
      channelMap.set(s.channel, cur);
    }
    const channels = [...channelMap.entries()].sort(
      (a, b) => b[1].revenue - a[1].revenue
    );

    // Top productos por ingresos.
    const prodMap = new Map<string, { count: number; revenue: number }>();
    for (const s of sales) {
      const cur = prodMap.get(s.productName) ?? { count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += s.soldPrice;
      prodMap.set(s.productName, cur);
    }
    const topProducts = [...prodMap.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // --- Par de monedas / inflación ---
    // Costo del inventario aún en stock (no vendido), en ambas monedas.
    const inStock = products.filter((p) => p.status !== "sold");
    const invBob = inStock.reduce((a, p) => a + productCost(p), 0);
    const invUsd = inStock.reduce((a, p) => a + productCostUsd(p), 0);
    // Tipo de cambio implícito (Bs por 1 USD) promedio sobre las piezas que
    // tienen ambos montos. Si sube con el tiempo => el boliviano se devalúa.
    const fxSamples = products
      .filter((p) => (p.purchasePriceUsd ?? 0) > 0)
      .map((p) => p.purchasePrice! / p.purchasePriceUsd!);
    const fxAvg =
      fxSamples.length > 0
        ? fxSamples.reduce((a, n) => a + n, 0) / fxSamples.length
        : 0;
    const fxMin = fxSamples.length ? Math.min(...fxSamples) : 0;
    const fxMax = fxSamples.length ? Math.max(...fxSamples) : 0;
    // Tipo de cambio implícito promedio de lo VENDIDO (snapshots de la venta).
    const fxSales = sales.filter((s) => (s.fxRate ?? 0) > 0).map((s) => s.fxRate!);
    const fxSalesAvg =
      fxSales.length > 0
        ? fxSales.reduce((a, n) => a + n, 0) / fxSales.length
        : 0;

    // --- Clicks ("más vistos") — leídos de products.clicks (Supabase) ---
    const mostViewed = products
      .map((p) => ({ name: p.name, status: p.status, clicks: p.clicks ?? 0 }))
      .filter((p) => p.clicks > 0)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 8);
    const totalClicks = products.reduce((a, p) => a + (p.clicks ?? 0), 0);
    const maxViews = mostViewed[0]?.clicks ?? 0;

    return {
      revenue,
      cost,
      profit,
      margin,
      categories,
      channels,
      topProducts,
      maxCatUnits: categories[0]?.units ?? 0,
      invBob,
      invUsd,
      fxAvg,
      fxMin,
      fxMax,
      fxSalesAvg,
      mostViewed,
      totalClicks,
      maxViews,
    };
  }, [sales, products]);

  const best = data.categories[0];

  return (
    <div>
      <PageHeader
        title="Estadísticas"
        subtitle={`${sales.length} ventas históricas`}
      />

      {/* KPIs financieros */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={Wallet} label="Ingresos" value={formatPrice(data.revenue)} />
        <Kpi icon={Coins} label="Costos" value={formatPrice(data.cost)} />
        <Kpi
          icon={TrendingUp}
          label="Ganancia"
          value={formatPrice(data.profit)}
          accent
        />
        <Kpi icon={Percent} label="Margen" value={`${data.margin.toFixed(0)}%`} />
      </div>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-bone/40">
        Este mes: {formatPrice(stats.soldThisMonthAmount)} en ingresos ·{" "}
        <span className="text-emerald-300">
          {formatPrice(stats.soldThisMonthProfit)} de ganancia
        </span>{" "}
        ({stats.soldThisMonthCount} ventas)
      </p>

      {/* Dona ingresos vs egresos */}
      <Panel className="mt-8">
        <SectionHead icon={PieChart} title="Ingresos vs egresos" />
        {data.revenue === 0 && data.cost === 0 ? (
          <Empty text="Aún no hay movimientos." />
        ) : (
          <div className="flex flex-col items-center gap-8 p-6 sm:flex-row sm:justify-center sm:gap-12">
            <Donut
              segments={[
                { label: "Ingresos", value: data.revenue, color: "#34d399" },
                { label: "Egresos", value: data.cost, color: "#f87171" },
              ]}
              centerTop={formatPrice(data.profit)}
              centerLabel="Ganancia"
              centerPositive={data.profit >= 0}
            />
            <ul className="flex w-full max-w-xs flex-col gap-3 sm:w-56">
              <LegendRow color="#34d399" label="Ingresos" value={formatPrice(data.revenue)} />
              <LegendRow color="#f87171" label="Egresos" value={formatPrice(data.cost)} />
              <li className="mt-1 flex items-center justify-between border-t border-char pt-3">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-bone/55">
                  Ganancia
                </span>
                <span
                  className={cn(
                    "font-display text-base font-bold",
                    data.profit >= 0 ? "text-emerald-300" : "text-red-400"
                  )}
                >
                  {formatPrice(data.profit)}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-bone/55">
                  Margen
                </span>
                <span className="font-mono text-[12px] text-bone/70">
                  {data.margin.toFixed(0)}%
                </span>
              </li>
            </ul>
          </div>
        )}
      </Panel>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Categoría que más se vende */}
        <Panel>
          <SectionHead icon={Trophy} title="Categorías más vendidas" />
          {data.categories.length === 0 ? (
            <Empty text="Aún no hay ventas con categoría." />
          ) : (
            <div className="p-5">
              {best && (
                <div className="mb-5 flex items-center gap-3 border border-ember/40 bg-ember/5 p-4">
                  <Trophy className="h-6 w-6 text-ember" />
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-bone/45">
                      La que más vendes
                    </p>
                    <p className="font-display text-xl font-bold uppercase tracking-wide text-bone">
                      {best.name}
                    </p>
                    <p className="font-mono text-[11px] tracking-[0.1em] text-ember-2">
                      {best.units} {best.units === 1 ? "venta" : "ventas"} ·{" "}
                      {formatPrice(best.revenue)}
                    </p>
                  </div>
                </div>
              )}
              <ul className="flex flex-col gap-3">
                {data.categories.map((c) => (
                  <li key={c.name}>
                    <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.12em]">
                      <span className="flex items-center gap-1.5 text-bone/70">
                        <Tag className="h-3 w-3 text-ember" />
                        {c.name}
                      </span>
                      <span className="text-bone/50">
                        {c.units} u · {formatPrice(c.revenue)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full bg-char">
                      <div
                        className="h-full bg-ember"
                        style={{
                          width: `${
                            data.maxCatUnits > 0
                              ? (c.units / data.maxCatUnits) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          {/* Ventas por canal */}
          <Panel>
            <SectionHead icon={Wallet} title="Ventas por canal" />
            {data.channels.length === 0 ? (
              <Empty text="Sin ventas." />
            ) : (
              <ul className="divide-y divide-char">
                {data.channels.map(([ch, v]) => (
                  <li
                    key={ch}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-bone/65">
                      {SALE_CHANNEL_LABEL[ch]}
                    </span>
                    <span className="font-mono text-[11px] text-bone/50">
                      {v.count} · {formatPrice(v.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Top productos */}
          <Panel>
            <SectionHead icon={TrendingUp} title="Top productos por ingresos" />
            {data.topProducts.length === 0 ? (
              <Empty text="Sin ventas." />
            ) : (
              <ul className="divide-y divide-char">
                {data.topProducts.map((p, i) => (
                  <li
                    key={p.name}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-[11px] text-ember">
                        {i + 1}.
                      </span>
                      <span className="truncate font-display text-sm uppercase tracking-wide text-bone">
                        {p.name}
                      </span>
                    </span>
                    <span className="shrink-0 font-display text-sm font-bold text-bone">
                      {formatPrice(p.revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {/* Par de monedas / inflación */}
      <Panel className="mt-8">
        <SectionHead icon={ArrowLeftRight} title="Monedas e inflación (BOB / USD)" />
        <div className="grid grid-cols-1 gap-px bg-char sm:grid-cols-3">
          <Metric
            label="Costo inventario (Bs)"
            value={formatPrice(data.invBob)}
            hint="Piezas aún en stock"
          />
          <Metric
            label="Costo inventario (USD)"
            value={formatPrice(data.invUsd, "USD")}
            hint="Mismo inventario, en dólares"
          />
          <Metric
            label="T/C implícito prom."
            value={`${data.fxAvg.toFixed(2)} Bs/$`}
            hint={
              data.fxMin > 0
                ? `rango ${data.fxMin.toFixed(2)}–${data.fxMax.toFixed(2)}`
                : "sin datos USD"
            }
            accent
          />
        </div>
        <p className="px-5 py-4 font-mono text-[10px] leading-relaxed uppercase tracking-[0.12em] text-bone/40">
          El <span className="text-bone/70">tipo de cambio implícito</span> es los
          bolivianos que costó cada dólar de mercadería. Si sube con el tiempo, el
          boliviano se devalúa: ahí se aprecia la inflación.
          {data.fxSalesAvg > 0 && (
            <>
              {" "}
              T/C promedio de lo ya vendido:{" "}
              <span className="text-ember-2">
                {data.fxSalesAvg.toFixed(2)} Bs/$
              </span>
              .
            </>
          )}
        </p>
      </Panel>

      {/* Productos más vistos (clicks) */}
      <Panel className="mt-8">
        <SectionHead
          icon={Eye}
          title={`Productos más vistos · ${data.totalClicks} clicks`}
        />
        {data.mostViewed.length === 0 ? (
          <Empty text="Aún no hay visitas registradas." />
        ) : (
          <ul className="flex flex-col gap-3 p-5">
            {data.mostViewed.map((p, i) => (
              <li key={p.name}>
                <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.12em]">
                  <span className="flex min-w-0 items-center gap-2 text-bone/70">
                    <span className="text-ember">{i + 1}.</span>
                    <span className="truncate">{p.name}</span>
                  </span>
                  <span className="shrink-0 text-bone/50">
                    <Eye className="mr-1 inline h-3 w-3" />
                    {p.clicks}
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full bg-char">
                  <div
                    className="h-full bg-ember"
                    style={{
                      width: `${
                        data.maxViews > 0 ? (p.clicks / data.maxViews) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-ink-2 px-5 py-4">
      <p
        className={cn(
          "font-display text-2xl font-bold",
          accent ? "text-ember" : "text-bone"
        )}
      >
        {value}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-bone/45">
        {label}
      </p>
      {hint && (
        <p className="mt-0.5 font-mono text-[10px] tracking-[0.1em] text-bone/30">
          {hint}
        </p>
      )}
    </div>
  );
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

/** Dona en SVG puro (sin librerías). Los segmentos se dibujan con dasharray. */
function Donut({
  segments,
  size = 200,
  stroke = 30,
  centerTop,
  centerLabel,
  centerPositive = true,
}: {
  segments: DonutSegment[];
  size?: number;
  stroke?: number;
  centerTop: string;
  centerLabel: string;
  centerPositive?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;

  let acc = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={centerLabel}>
        {/* pista de fondo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#26262b"
          strokeWidth={stroke}
        />
        {segments.map((seg) => {
          const len = (seg.value / total) * c;
          const dash = `${len} ${c - len}`;
          const offset = -acc;
          acc += len;
          return (
            <circle
              key={seg.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={dash}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-bone/40">
          {centerLabel}
        </span>
        <span
          className={cn(
            "font-display text-xl font-bold",
            centerPositive ? "text-emerald-300" : "text-red-400"
          )}
        >
          {centerTop}
        </span>
      </div>
    </div>
  );
}

function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-bone/65">
        <span
          className="h-3 w-3 rounded-sm"
          style={{ background: color }}
        />
        {label}
      </span>
      <span className="font-display text-sm font-bold text-bone">{value}</span>
    </li>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "border bg-ink-2 p-5",
        accent ? "border-ember/40" : "border-char"
      )}
    >
      <Icon className={cn("h-5 w-5", accent ? "text-ember" : "text-bone/50")} />
      <p
        className={cn(
          "mt-4 font-display text-2xl font-bold",
          accent ? "text-ember" : "text-bone"
        )}
      >
        {value}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-bone/45">
        {label}
      </p>
    </div>
  );
}

function SectionHead({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-char px-5 py-3.5">
      <Icon className="h-4 w-4 text-ember" />
      <span className="font-display text-sm font-bold uppercase tracking-[0.1em] text-bone">
        {title}
      </span>
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
