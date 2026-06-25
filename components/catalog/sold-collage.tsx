import Image from "next/image";
import { SectionHeading } from "@/components/section";

/**
 * Salón de trofeos: collage de las piezas ya vendidas. Las fotos viven en
 * `public/collage_productos/1.jpg … N.jpg`. Se reparten en varias filas que se
 * desplazan en horizontal (sentidos alternos) con una leve rotación, dando la
 * sensación de "fotos volando". Es decorativo y puramente CSS (sin JS).
 */

const TOTAL = 63; // nº de imágenes en /public/collage_productos
const ROWS = 3;

// Rotaciones y anchos deterministas (por índice) para que se vea desordenado
// pero estable entre renders (sin Math.random → sin desajustes de hidratación).
const ROT = [-3, 1.5, -1.2, 2.6, -2, 1, -2.6, 2.2, -0.8, 3];
const WIDTHS = [150, 188, 162, 204, 174, 196, 158];

function Tile({ n }: { n: number }) {
  const rot = ROT[n % ROT.length];
  const w = WIDTHS[n % WIDTHS.length];
  return (
    <div
      className="relative mx-2 my-3 h-28 shrink-0 overflow-hidden border border-char bg-ink-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:z-10 hover:!rotate-0 hover:scale-[1.06] sm:h-32 md:h-36"
      style={{ width: `${w}px`, transform: `rotate(${rot}deg)` }}
    >
      <Image
        src={`/collage_productos/${n}.jpg`}
        alt="Pieza vendida del Arsenal"
        fill
        sizes="220px"
        className="object-cover"
      />
    </div>
  );
}

export function SoldCollage() {
  // Reparte 1..TOTAL en ROWS filas.
  const rows: number[][] = Array.from({ length: ROWS }, () => []);
  for (let n = 1; n <= TOTAL; n++) rows[(n - 1) % ROWS].push(n);

  // Duraciones distintas por fila para que no marchen sincronizadas.
  const durations = ["70s", "88s", "78s"];

  return (
    <section className="relative overflow-hidden border-y border-char bg-ink py-14 md:py-20">
      <div className="mx-auto max-w-[1500px] px-6 md:px-12 lg:px-16">
        <SectionHeading
          eyebrow="Salón de trofeos"
          title="Piezas ya reclutadas"
          description="Cada una de estas miniaturas ya encontró a su comandante. Un vistazo a todo lo que ha salido del Arsenal."
        />
      </div>

      <div
        className="mt-10 flex flex-col gap-1"
        style={{
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)",
          maskImage:
            "linear-gradient(90deg, transparent 0%, #000 6%, #000 94%, transparent 100%)",
        }}
      >
        {rows.map((row, i) => (
          <div key={i} className="marquee overflow-hidden">
            <div
              className={`marquee-track ${i % 2 === 1 ? "marquee-track--reverse" : ""}`}
              style={{ ["--marquee-duration" as string]: durations[i] }}
            >
              {/* La lista va duplicada: al desplazar -50% el bucle es continuo. */}
              {[...row, ...row].map((n, idx) => (
                <Tile key={`${i}-${idx}-${n}`} n={n} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
