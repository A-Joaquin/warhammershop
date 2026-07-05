"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Search, SlidersHorizontal, X, Rocket } from "lucide-react";
import type { Combo, Product, ProductStatus } from "@/lib/types";
import { factionName, factionAccent } from "@/lib/data/factions";
import { legionForSlug } from "@/lib/data/legions";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/catalog/product-card";
import { ComboCard } from "@/components/catalog/combo-card";
import { Input } from "@/components/ui/input";

type SortKey = "novedad" | "precio-asc" | "precio-desc" | "nombre";

const STATUS_FILTERS: { value: ProductStatus; label: string }[] = [
  { value: "available", label: "Disponible" },
  { value: "reserved", label: "Reservado" },
  { value: "coming_soon", label: "Próximo" },
  { value: "sold", label: "Vendido" },
];

export function Catalog({
  products,
  combos = [],
  factionLogos = {},
  initialFaction = "",
  initialCategory = "",
}: {
  products: Product[];
  combos?: Combo[];
  factionLogos?: Record<string, string>;
  initialFaction?: string;
  initialCategory?: string;
}) {
  const [query, setQuery] = useState("");
  const [faction, setFaction] = useState(initialFaction);
  const [category, setCategory] = useState(initialCategory);
  const [statuses, setStatuses] = useState<ProductStatus[]>([]);
  const [launch, setLaunch] = useState(""); // id del lanzamiento (coming_soon) elegido
  const [sort, setSort] = useState<SortKey>("novedad");
  const [mobileFilters, setMobileFilters] = useState(false);
  const [viewCombos, setViewCombos] = useState(false);

  const toggleStatus = (s: ProductStatus) => {
    setViewCombos(false);
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  // Al cambiar de facción, el lanzamiento elegido podría no pertenecerle: lo limpiamos.
  const selectFaction = (slug: string) => {
    setViewCombos(false);
    setFaction(slug);
    setLaunch("");
  };

  // Facciones/marcas presentes en el catálogo (incluye las nuevas no-Warhammer).
  const factionOptions = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; accent: string }>();
    for (const p of products) {
      if (!map.has(p.faction))
        map.set(p.faction, {
          slug: p.faction,
          name: factionName(p.faction),
          accent: factionAccent(p.faction),
        });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Categorías presentes (principal + secundaria).
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
      if (p.category2) set.add(p.category2);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [products]);

  // ¿Hay próximos lanzamientos en el catálogo? (define si se muestra el apartado).
  const hasLaunches = useMemo(
    () => products.some((p) => p.status === "coming_soon"),
    [products]
  );

  // Lanzamientos (coming_soon) disponibles, acotados a la facción seleccionada.
  const launchOptions = useMemo(
    () =>
      products
        .filter(
          (p) =>
            p.status === "coming_soon" && (!faction || p.faction === faction)
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [products, faction]
  );

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (faction && p.faction !== faction) return false;
      if (category && p.category !== category && p.category2 !== category)
        return false;
      // Si hay un lanzamiento elegido, manda él (ignora el filtro de estado);
      // si no, aplica el filtro de estado normal.
      if (launch) {
        if (p.id !== launch) return false;
      } else if (statuses.length && !statuses.includes(p.status)) {
        return false;
      }
      if (query) {
        const q = query.toLowerCase();
        const hay = `${p.name} ${p.line} ${p.sku}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "precio-asc":
          return a.price - b.price;
        case "precio-desc":
          return b.price - a.price;
        case "nombre":
          return a.name.localeCompare(b.name);
        default:
          return 0; // novedad = orden de inserción
      }
    });
    return list;
  }, [products, faction, category, statuses, launch, query, sort]);

  const filteredCombos = useMemo(() => {
    const q = query.trim().toLowerCase();
    return combos.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [combos, query]);

  const hasActiveFilters =
    faction || category || statuses.length > 0 || launch || query;

  // Ícono de una facción: el guardado en la facción o, si no, el de la legión
  // que coincida por slug.
  const logoFor = (slug: string) =>
    factionLogos[slug] || legionForSlug(slug)?.logo;

  // Facción seleccionada (para el encabezado sobre los productos).
  const selectedFaction = faction
    ? factionOptions.find((f) => f.slug === faction)
    : undefined;
  const selectedLegion = legionForSlug(faction);
  const selectedLogo = faction ? logoFor(faction) : undefined;
  const clearAll = () => {
    setFaction("");
    setCategory("");
    setStatuses([]);
    setLaunch("");
    setQuery("");
    setViewCombos(false);
  };

  const Filters = (
    <div className="space-y-8">
      {/* Facciones / marcas */}
      <div>
        <h3 className="font-mono text-[11px] tracking-[0.24em] uppercase text-bone/40">
          Facción / marca
        </h3>
        <div className="mt-3 flex flex-col gap-1">
          <button
            onClick={() => selectFaction("")}
            className={cn(
              "flex items-center justify-between px-3 py-2 text-left font-display text-sm uppercase tracking-wide transition-colors",
              faction === "" && !viewCombos
                ? "bg-ember/10 text-ember"
                : "text-bone/60 hover:text-bone"
            )}
          >
            Todas
          </button>
          {combos.length > 0 && (
            <button
              onClick={() => setViewCombos(true)}
              className={cn(
                "flex items-center justify-between px-3 py-2 text-left font-display text-sm uppercase tracking-wide transition-colors",
                viewCombos
                  ? "bg-ember/10 text-ember"
                  : "text-bone/60 hover:text-bone"
              )}
            >
              Combos
            </button>
          )}
          {factionOptions.map((f) => {
            const logo = logoFor(f.slug);
            return (
              <button
                key={f.slug}
                onClick={() => selectFaction(f.slug)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-left font-display text-sm uppercase tracking-wide transition-colors",
                  faction === f.slug
                    ? "bg-ember/10 text-ember"
                    : "text-bone/60 hover:text-bone"
                )}
              >
                {logo ? (
                  <Image
                    src={logo}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 shrink-0 object-contain"
                  />
                ) : (
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: f.accent }}
                  />
                )}
                {f.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Estado */}
      <div>
        <h3 className="font-mono text-[11px] tracking-[0.24em] uppercase text-bone/40">
          Estado
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => toggleStatus(s.value)}
              className={cn(
                "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                statuses.includes(s.value)
                  ? "border-ember bg-ember/10 text-ember"
                  : "border-char text-bone/55 hover:border-steel"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lanzamientos (próximos = coming_soon), acotados por la facción elegida */}
      {hasLaunches && (
        <div>
          <h3 className="font-mono text-[11px] tracking-[0.24em] uppercase text-bone/40">
            Lanzamientos
          </h3>
          {launchOptions.length === 0 ? (
            <p className="mt-3 font-mono text-[11px] text-bone/35">
              Sin lanzamientos para esta facción.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-1">
              {launchOptions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setViewCombos(false);
                    setLaunch(launch === p.id ? "" : p.id);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-left font-display text-sm uppercase tracking-wide transition-colors",
                    launch === p.id
                      ? "bg-ember/10 text-ember"
                      : "text-bone/60 hover:text-bone"
                  )}
                >
                  <Rocket className="h-3.5 w-3.5 shrink-0 text-ember/70" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Categoría */}
      {categoryOptions.length > 0 && (
        <div>
          <h3 className="font-mono text-[11px] tracking-[0.24em] uppercase text-bone/40">
            Categoría
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {categoryOptions.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setViewCombos(false);
                  setCategory(category === c ? "" : c);
                }}
                className={cn(
                  "border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                  category === c
                    ? "border-ember bg-ember/10 text-ember"
                    : "border-char text-bone/55 hover:border-steel"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1500px] px-6 py-12 md:px-12 lg:px-16">
      {/* Barra superior: búsqueda + orden */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bone/40" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, línea o SKU…"
            className="pl-10"
            aria-label="Buscar productos"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilters(true)}
            className="inline-flex items-center gap-2 border border-char px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-bone/70 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Ordenar"
            className="border border-char bg-ink-2 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-bone/80 focus:border-ember/70 focus:outline-none"
          >
            <option value="novedad">Novedad</option>
            <option value="precio-asc">Precio: menor</option>
            <option value="precio-desc">Precio: mayor</option>
            <option value="nombre">Nombre A–Z</option>
          </select>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block">{Filters}</aside>

        {/* Resultados */}
        <div>
          {selectedFaction && (
            <div className="relative mb-8 flex flex-row items-center justify-center gap-5 overflow-hidden text-left md:gap-8">
              {selectedLogo ? (
                <Image
                  src={selectedLogo}
                  alt={selectedFaction.name}
                  width={256}
                  height={256}
                  className="h-44 w-44 shrink-0 object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] md:h-64 md:w-64"
                />
              ) : (
                <span
                  className="h-28 w-28 shrink-0 rounded-full border md:h-36 md:w-36"
                  style={{
                    borderColor: selectedFaction.accent,
                    background: `${selectedFaction.accent}33`,
                  }}
                />
              )}
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-bone/55 md:text-sm">
                  {selectedLegion ? "Legión" : "Facción"}
                </p>
                <h2 className="font-gothic text-4xl uppercase leading-[0.95] tracking-wide text-bone md:text-6xl">
                  {selectedFaction.name}
                </h2>
                {selectedLegion?.motto && (
                  <p className="mt-2 font-mono text-sm italic tracking-wide text-bone/60 md:text-base">
                    “{selectedLegion.motto}”
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mb-5 flex items-center justify-between">
            <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-bone/40">
              {viewCombos
                ? `${filteredCombos.length} ${filteredCombos.length === 1 ? "combo" : "combos"}`
                : `${filtered.length} ${filtered.length === 1 ? "pieza" : "piezas"}`}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ember/80 hover:text-ember"
              >
                <X className="h-3.5 w-3.5" /> Limpiar filtros
              </button>
            )}
          </div>

          {viewCombos ? (
            filteredCombos.length === 0 ? (
              <div className="border border-dashed border-char py-24 text-center">
                <p className="font-display text-xl uppercase text-bone/60">
                  Sin combos
                </p>
                <p className="mt-2 text-sm text-bone/40">
                  Ajusta la búsqueda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredCombos.map((c) => (
                  <ComboCard key={c.id} combo={c} />
                ))}
              </div>
            )
          ) : (
            <>
              {filtered.length === 0 ? (
                <div className="border border-dashed border-char py-24 text-center">
                  <p className="font-display text-xl uppercase text-bone/60">
                    Sin resultados
                  </p>
                  <p className="mt-2 text-sm text-bone/40">
                    Ajusta los filtros o limpia la búsqueda.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}

              {faction === "" && filteredCombos.length > 0 && (
                <section className="mt-14 border-t border-char pt-10">
                  <h2 className="font-display text-xl font-bold uppercase tracking-tight text-bone">
                    Combos
                  </h2>
                  <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredCombos.map((c) => (
                      <ComboCard key={c.id} combo={c} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {/* Drawer de filtros (móvil) */}
      {mobileFilters && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            onClick={() => setMobileFilters(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[82%] max-w-sm overflow-y-auto border-l border-char bg-ink-2 p-6">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-display text-lg uppercase tracking-wide text-bone">
                Filtros
              </span>
              <button onClick={() => setMobileFilters(false)} aria-label="Cerrar">
                <X className="h-5 w-5 text-bone/70" />
              </button>
            </div>
            {Filters}
            <button
              onClick={() => setMobileFilters(false)}
              className="mt-8 w-full bg-ember px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink"
            >
              Ver {filtered.length} piezas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
