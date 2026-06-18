import type { Metadata } from "next";
import { PageIntro } from "@/components/section";
import { Catalog } from "@/components/catalog/catalog";
import { getAllProducts, getFactions } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Explora el armerío completo: miniaturas y piezas de colección Warhammer 40.000 por facción, estado y precio.",
};

// ISR: refresca el catálogo cada minuto sin re-desplegar.
export const revalidate = 60;

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<{ faction?: string; category?: string }>;
}) {
  const { faction, category } = await searchParams;
  const [products, factions] = await Promise.all([
    getAllProducts(),
    getFactions(),
  ]);

  // Mapa slug → logo para que el catálogo muestre el ícono de cada facción.
  const factionLogos: Record<string, string> = {};
  for (const f of factions) {
    if (f.logo) factionLogos[f.slug] = f.logo;
  }

  return (
    <>
      <PageIntro
        eyebrow="El Armerío"
        title="Catálogo de batalla"
        description="Cada pieza es única. Filtra por facción, estado o precio y coordina tu compra por WhatsApp."
      />
      <Catalog
        products={products}
        factionLogos={factionLogos}
        initialFaction={faction ?? ""}
        initialCategory={category ?? ""}
      />
    </>
  );
}
