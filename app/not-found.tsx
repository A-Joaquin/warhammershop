import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-32 text-center">
      <p className="font-mono text-[12px] uppercase tracking-[0.3em] text-ember">
        Error 404 · Señal perdida
      </p>
      <h1 className="mt-4 font-display text-6xl font-bold uppercase tracking-tight text-bone md:text-8xl">
        Sin respuesta
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-bone/55">
        Esta página se perdió en la Disformidad. El Emperador protege, pero este
        enlace ya no existe.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center justify-center bg-ember px-8 py-4 font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-ink transition-all hover:-translate-y-px glow-accent"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
