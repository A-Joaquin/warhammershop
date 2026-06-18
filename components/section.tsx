import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-mono text-[12px] tracking-[0.28em] uppercase text-ember",
        className
      )}
    >
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && <Eyebrow>— {eyebrow}</Eyebrow>}
      <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight text-bone md:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-bone/55">
          {description}
        </p>
      )}
    </div>
  );
}

/** Banner de cabecera para páginas internas (deja espacio bajo el header fijo). */
export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <section className="relative border-b border-char bg-ink-2 panel-grain pt-32 pb-12 md:pt-40 md:pb-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(80% 120% at 0% 0%, color-mix(in srgb, var(--color-ember) 12%, transparent) 0%, transparent 55%)",
        }}
      />
      <div className="relative mx-auto max-w-[1500px] px-6 md:px-12 lg:px-16">
        <Eyebrow>— {eyebrow}</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-bone md:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-bone/55 md:text-lg">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
