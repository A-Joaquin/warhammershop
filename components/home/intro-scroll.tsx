"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Hero } from "@/components/home/hero";
import { waLink } from "@/lib/whatsapp";

/* Coordenadas en el sistema del mapa (viewBox 0..100, imagen cuadrada). */
const ORIGIN = { x: 41, y: 54 }; // Cochabamba
const DEPTS = [
  { name: "Beni", x: 41, y: 38 },
  { name: "Santa Cruz", x: 68, y: 62 },
  { name: "Chuquisaca", x: 50, y: 80 },
  { name: "Tarija", x: 50, y: 87 },
  { name: "Potosí", x: 33, y: 80 },
  { name: "Oruro", x: 25, y: 66 },
  { name: "La Paz", x: 20, y: 39 },
  { name: "Pando", x: 25, y: 13 },
];
const GALLERY = [4, 5, 6, 7]; // /transicion/cN.webp

function arcPath(o: { x: number; y: number }, t: { x: number; y: number }) {
  const mx = (o.x + t.x) / 2;
  const my = (o.y + t.y) / 2;
  const dist = Math.hypot(t.x - o.x, t.y - o.y);
  const lift = Math.min(40, Math.max(10, dist * 0.6));
  return `M ${o.x} ${o.y} Q ${mx} ${my - lift} ${t.x} ${t.y}`;
}

export function IntroScroll() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const emberRef = useRef<HTMLCanvasElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const outroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let killed = false;
    let cleanup = () => {};

    (async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const { MotionPathPlugin } = await import("gsap/MotionPathPlugin");
      if (killed) return;
      gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

      const ctx = gsap.context(() => {
        const q = gsap.utils.selector(rootRef);
        const arcs = q<SVGPathElement>(".arc");
        const missiles = q<SVGGElement>(".missile");
        const impacts = q<SVGGElement>(".impact");
        const markers = q<SVGGElement>(".marker");
        const gimgs = q<HTMLDivElement>(".gimg");
        const gdots = q<HTMLDivElement>(".gdot");

        // Pulso del origen (Cochabamba), siempre activo.
        gsap.to(q(".origin-ring"), {
          scale: 1.9,
          opacity: 0,
          duration: 1.8,
          repeat: -1,
          ease: "power1.out",
          transformOrigin: "center",
          svgOrigin: `${ORIGIN.x} ${ORIGIN.y}`,
        });

        // ⚡ OCULTACIÓN RADICAL AL INICIO: Evita que parpadeen en el frame 0 del renderizado
        gsap.set(missiles, { autoAlpha: 0, scale: 0, opacity: 0, transformOrigin: "center" });
        gsap.set(impacts, { autoAlpha: 0, scale: 0, opacity: 0, transformOrigin: "center" });

        const desktop =
          window.matchMedia("(min-width: 1024px)").matches &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        // Móvil / reduced-motion: apilado vertical, estado final estático.
        if (!desktop) {
          arcs.forEach((a) => {
            const len = a.getTotalLength();
            gsap.set(a, { strokeDasharray: len, strokeDashoffset: 0, opacity: 0.32 });
          });
          gsap.set(markers, { autoAlpha: 1 });
          gsap.set(introRef.current, { autoAlpha: 0, display: "none" });
          gsap.set(outroRef.current, { autoAlpha: 1 });
          gsap.set(gimgs, { autoAlpha: 1 });
          gsap.set(gdots, { autoAlpha: 0.4 });
          return;
        }

        // Estado inicial de misiles (Solo Desktop)
        DEPTS.forEach((d, i) => {
          const arc = arcs[i];
          if (!arc) return;
          const len = arc.getTotalLength();
          gsap.set(arc, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
          gsap.set(markers[i], { autoAlpha: 0.18 });
        });

        // Estado inicial de la galería
        gsap.set(gimgs, { autoAlpha: 0 });
        gsap.set(gimgs[0], { autoAlpha: 1 });
        gsap.set(gdots, { autoAlpha: 0.25 });
        gsap.set(gdots[0], { autoAlpha: 1 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: pinRef.current,
            start: "top top",
            end: "+=4800",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // FASE 1 — pan del loop al mapa.
        const vwUnit = () => window.innerWidth / 100;
        tl.to(trackRef.current, { x: () => -88.5 * vwUnit(), duration: 0.13 }, 0);

        // FASE 2 — misiles desde Cochabamba.
        const M_START = 0.15, M_STEP = 0.02, M_FLY = 0.017;
        DEPTS.forEach((d, i) => {
          const arc = arcs[i];
          if (!arc) return;
          const p = M_START + i * M_STEP;

          tl.set(missiles[i], { autoAlpha: 1, opacity: 1, scale: 1 }, p)
            .to(missiles[i], { motionPath: { path: arc, autoRotate: false }, duration: M_FLY }, p)
            .to(arc, { strokeDashoffset: 0, duration: M_FLY }, p)
            .set(missiles[i], { autoAlpha: 0, scale: 0 }, p + M_FLY)
            .to(impacts[i], { autoAlpha: 1, scale: 1, opacity: 1, duration: 0.025, ease: "power2.out" }, p + M_FLY - 0.008)
            .to(impacts[i], { autoAlpha: 0, scale: 0, opacity: 0, duration: 0.05, ease: "power1.in" }, p + M_FLY + 0.02)
            .to(markers[i], { autoAlpha: 1, duration: 0.025 }, p + M_FLY - 0.008)
            .to(arc, { opacity: 0.32, duration: 0.1 }, p + M_FLY + 0.01);
        });

        // OPTIMIZACIÓN DE TEXTOS: Simultáneo con bombardeo
        tl.fromTo(introRef.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.02, ease: "power3.out" }, 0.04);
        tl.to(introRef.current, { autoAlpha: 0, y: -10, duration: 0.015 }, 0.22);
        tl.fromTo(outroRef.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.02, ease: "power3.out" }, 0.23);

        // FASE 3 — pan del mapa a la galería
        tl.to(trackRef.current, { x: () => -126 * vwUnit(), duration: 0.08 }, 0.28);

        // FASE 4 — ciclo de imágenes cyberpunk
        // FASE 4 — ciclo de imágenes con transición cyberpunk.
        // ⚡ EQUILIBRIO: Damos buen espacio total para que no se amontonen...
        const G_START = 0.35; 
        const G_END = 0.45; 
        const slot = (G_END - G_START) / GALLERY.length;
        
        const CA_OUT =
          "drop-shadow(4px 0 #ff7a3c) drop-shadow(-4px 0 #ffd86b) saturate(1.6) contrast(1.3)";
        const CA_IN =
          "drop-shadow(-3px 0 #ff7a3c) drop-shadow(3px 0 #ffd86b) saturate(1.45)";

        for (let i = 1; i < GALLERY.length; i++) {
          const A = gimgs[i - 1];
          const B = gimgs[i];
          const p = G_START + i * slot;
          
          // ⚡ ...pero hacemos que la transición sea un destello ultra rápido (0.003) para que no se sienta forzado
          // glitch-out del actual
          tl.to(A, { x: -8, skewX: 6, filter: CA_OUT, duration: 0.003, ease: "steps(1)" }, p)
            .to(A, { x: 10, skewX: -5, filter: CA_OUT, duration: 0.003, ease: "steps(1)" }, p + 0.003)
            .to(A, { x: 0, skewX: 0, autoAlpha: 0, filter: "none", duration: 0.004 }, p + 0.006);
          
          // glitch-in del siguiente
          tl.set(B, { autoAlpha: 1 }, p + 0.005)
            .fromTo(
              B,
              { x: 8, skewX: -6, filter: CA_IN },
              { x: 0, skewX: 0, filter: "none", duration: 0.005, ease: "steps(3)" },
              p + 0.006
            );
          
          // indicadores
          tl.to(gdots[i - 1], { autoAlpha: 0.25, duration: 0.003 }, p)
            .to(gdots[i], { autoAlpha: 1, duration: 0.003 }, p + 0.005);
        }
      }, rootRef);

      cleanup = () => ctx.revert();
    })();

    return () => {
      killed = true;
      cleanup();
    };
  }, []);

  /* ---------- Brasas (Ember Canvas Animation) ---------- */
  useEffect(() => {
    const canvas = emberRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, raf = 0;
    type P = { x: number; y: number; r: number; vy: number; vx: number; drift: number; driftSpd: number; life: number; flick: number; bone: boolean };
    let ps: P[] = [];
    const COUNT = 70;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const spawn = (init: boolean): P => ({
      x: rand(0, W), y: init ? rand(0, H) : H + rand(0, 40), r: rand(0.6, 2.2),
      vy: rand(0.25, 0.85), vx: rand(-0.25, 0.25), drift: rand(0, Math.PI * 2),
      driftSpd: rand(0.005, 0.02), life: rand(0.4, 1), flick: rand(0, Math.PI * 2),
      bone: Math.random() < 0.2,
    });
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const init = () => { ps = Array.from({ length: COUNT }, () => spawn(true)); };
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.y -= p.vy; p.drift += p.driftSpd; p.x += p.vx + Math.sin(p.drift) * 0.3; p.flick += 0.08;
        const a = (0.3 + Math.sin(p.flick) * 0.28) * p.life;
        if (p.y < -10 || p.x < -20 || p.x > W + 20) Object.assign(p, spawn(false));
        const col = p.bone ? "236,230,216" : (Math.random() < 0.5 ? "245,76,38" : "255,122,60");
        ctx.beginPath();
        ctx.fillStyle = `rgba(${col},${Math.max(0, a).toFixed(3)})`;
        ctx.shadowBlur = 8; ctx.shadowColor = `rgba(245,76,38,${(a * 0.5).toFixed(3)})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(frame);
    };
    resize(); init(); frame();
    const onR = () => { cancelAnimationFrame(raf); resize(); init(); frame(); };
    window.addEventListener("resize", onR);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onR); };
  }, []);

  return (
    <section ref={rootRef} className="relative bg-ink">
      <div ref={pinRef} className="relative lg:h-screen lg:overflow-hidden">
        
        {/* Parallax Background */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-ink">
          <canvas ref={emberRef} className="absolute inset-0 h-full w-full" />
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(120% 90% at 50% 50%, transparent 35%, rgba(14,13,12,0.85) 100%)" }}
          />
        </div>

        <div ref={trackRef} className="relative z-10 flex flex-col lg:h-full lg:w-[272vw] lg:flex-row">
          {/* Panel 1 — Hero */}
          <div className="w-full shrink-0 lg:h-full lg:w-screen">
            <Hero />
          </div>

          {/* Panel 2 — Mapa de envíos */}
          <div className="relative flex w-full shrink-0 items-center lg:h-full lg:w-screen">
            <div className="relative z-10 flex w-full max-w-[1500px] flex-col items-center justify-center gap-6 px-6 py-24 lg:flex-row lg:justify-start lg:gap-0 lg:py-0 lg:pl-0 lg:pr-12">
              <div className="relative z-20 w-full shrink-0 lg:-ml-[1vw] lg:w-[36%]">
                <div ref={introRef}>
                  <p className="font-mono text-[12px] uppercase tracking-[0.28em] text-ember">
                    — Logística imperial
                  </p>
                  <h2 className="mt-3 font-gothic text-4xl uppercase leading-[0.95] tracking-tight text-ember md:text-5xl">
                    Desde el corazón de Bolivia
                  </h2>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-bone/55">
                    Nuestro arsenal parte de <span className="text-ember">Cochabamba</span>.
                    Sigue desplazándote y observa cómo desplegamos envíos a cada
                    rincón del país.
                  </p>
                </div>

                <div ref={outroRef} className="absolute inset-0" style={{ opacity: 0 }}>
                  <p className="font-mono text-[12px] uppercase tracking-[0.28em] text-ember">
                    — Cobertura nacional
                  </p>
                  <h2 className="mt-3 font-gothic text-4xl uppercase leading-[0.95] tracking-tight text-ember md:text-5xl">
                    Enviamos a todo el país
                  </h2>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-bone/55">
                    De Cochabamba a los 9 departamentos. Coordinamos cada envío
                    contigo, pieza por pieza, por WhatsApp.
                  </p>
                  <a
                    href={waLink("Hola, quiero coordinar un envío a mi departamento.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center justify-center gap-2 bg-gold px-7 py-4 font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-ink transition-transform hover:-translate-y-px"
                  >
                    Coordinar mi envío
                  </a>
                </div>
              </div>

              {/* Mapa + misiles */}
              <div className="relative aspect-square w-full max-w-[min(78vh,620px)] lg:w-[54%]">
                <Image
                  src="/mapabolivia.png"
                  alt="Mapa de Bolivia con los 9 departamentos"
                  fill
                  sizes="(max-width:1024px) 90vw, 55vw"
                  className="object-contain"
                />
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
                  <defs>
                    <radialGradient id="goldGlow">
                      <stop offset="0%" stopColor="#ffe9a8" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#ffe9a8" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Arcos de los viajes */}
                  {DEPTS.map((d, i) => (
                    <path key={`arc-${i}`} className="arc" d={arcPath(ORIGIN, d)} fill="none" stroke="#c9a24b" strokeWidth={0.5} strokeLinecap="round" />
                  ))}

                  {/* Marcadores estáticos en los departamentos */}
                  {DEPTS.map((d, i) => (
                    <g key={`mk-${i}`} className="marker">
                      <circle cx={d.x} cy={d.y} r={2.6} fill="none" stroke="#c9a24b" strokeWidth={0.3} opacity={0.6} />
                      <circle cx={d.x} cy={d.y} r={1.3} fill="#c9a24b" />
                    </g>
                  ))}

                  {/* Impactos */}
                  {DEPTS.map((d, i) => (
                    <g key={`im-${i}`} className="impact">
                      <circle cx={d.x} cy={d.y} r={4.5} fill="none" stroke="#ffe9a8" strokeWidth={0.5} />
                      <circle cx={d.x} cy={d.y} r={2} fill="url(#goldGlow)" />
                    </g>
                  ))}

                  {/* Misiles */}
                  {DEPTS.map((_, i) => (
                    <g key={`ms-${i}`} className="missile">
                      <image href="/servo.png" x={-7} y={-7} width={14} height={14} />
                    </g>
                  ))}

                  {/* Origen: Cochabamba */}
                  <g>
                    <circle className="origin-ring" cx={ORIGIN.x} cy={ORIGIN.y} r={3} fill="none" stroke="#ffe9a8" strokeWidth={0.6} />
                    <circle cx={ORIGIN.x} cy={ORIGIN.y} r={2.4} fill="url(#goldGlow)" />
                    <circle cx={ORIGIN.x} cy={ORIGIN.y} r={1.4} fill="#fff6df" />
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* Panel 3 — Galería */}
          <div className="relative z-20 flex w-full shrink-0 items-center lg:h-full lg:w-screen lg:-ml-[32vw]">
            <div className="relative z-10 flex w-full max-w-[1500px] flex-col items-center justify-center gap-8 px-6 py-24 lg:max-w-[940px] lg:flex-row lg:justify-start lg:gap-40 lg:py-0 lg:pl-[1vw] lg:pr-0">
              {/* Texto */}
              <div className="z-20 w-full shrink-0 lg:-ml-[3vw] lg:w-[36%]">
                <p className="font-mono text-[12px] uppercase tracking-[0.28em] text-ember">
                  — Archivo de combate
                </p>
                <h2 className="mt-3 font-gothic text-4xl font-bold uppercase leading-[0.95] tracking-tight text-bone md:text-5xl">
                  Forja tu legión
                </h2>
                <p className="mt-4 max-w-md text-base leading-relaxed text-bone/55">
                  Cada héroe del Imperio, capturado al detalle. Sigue desplazándote
                  para recorrer el arsenal.
                </p>
                {/* Indicadores */}
                <div className="mt-6 flex gap-2">
                  {GALLERY.map((n) => (
                    <span key={n} className="gdot h-1 w-8 bg-gold" />
                  ))}
                </div>
              </div>

              {/* Visor de imágenes */}
              <div className="relative aspect-[3/4] w-full max-w-[min(74vh,540px)] lg:w-[72%]">
                {GALLERY.map((n) => (
                  <div key={n} className="gimg absolute inset-0" style={{ willChange: "transform, opacity" }}>
                    <Image
                      src={`/transicion/c${n}.webp`}
                      alt={`Miniatura de la cruzada ${n}`}
                      fill
                      sizes="(max-width:1024px) 90vw, 45vw"
                      className="object-contain"
                    />
                  </div>
                ))}

                {/* Scanlines HUD */}
                <div
                  className="pointer-events-none absolute inset-0 z-20 mix-blend-screen opacity-40"
                  style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(201,162,75,0.16) 0px, rgba(201,162,75,0.16) 1px, transparent 1px, transparent 3px)" }}
                />
                <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
                  <div className="cyber-scan absolute inset-x-0 h-24" style={{ background: "linear-gradient(180deg, transparent, rgba(255,216,107,0.14), transparent)" }} />
                </div>
                {[
                  "left-0 top-0 border-l-2 border-t-2",
                  "right-0 top-0 border-r-2 border-t-2",
                  "left-0 bottom-0 border-l-2 border-b-2",
                  "right-0 bottom-0 border-r-2 border-b-2",
                ].map((c) => (
                  <span key={c} className={`pointer-events-none absolute z-20 h-7 w-7 border-gold/70 ${c}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}