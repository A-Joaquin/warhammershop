"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { SITE } from "@/lib/config";

const VIDEO_URL = "/video/hero-loop.mp4";
const CROSSFADE_MS = 700;
const TRIGGER_BEFORE_END = 0.7;

export function Hero() {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);

  /* ---------- Video dual crossfade ---------- */
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const a = videoARef.current;
    const b = videoBRef.current;
    if (!a) return;

    if (reduce) {
      a.src = VIDEO_URL;
      a.load();
      return;
    }
    if (isMobile || !b) {
      a.src = VIDEO_URL;
      a.loop = true;
      a.load();
      a.play().catch(() => {});
      return;
    }

    [a, b].forEach((v) => {
      v.src = VIDEO_URL;
      v.load();
    });
    let active = a;
    let standby = b;
    let raf = 0;
    a.play().catch(() => {});

    const tick = () => {
      if (active.duration && !isNaN(active.duration)) {
        const remaining = active.duration - active.currentTime;
        if (remaining <= TRIGGER_BEFORE_END && standby.paused) {
          standby.currentTime = 0;
          standby.play().catch(() => {});
          standby.style.opacity = "1";
          active.style.opacity = "0";
          const prevActive = active;
          const prevStandby = standby;
          setTimeout(() => {
            prevActive.pause();
          }, CROSSFADE_MS);
          active = prevStandby;
          standby = prevActive;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ---------- Embers canvas ---------- */
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    if (!canvas || reduce) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0,
      H = 0,
      raf = 0;
    type P = {
      x: number; y: number; r: number; vy: number; vx: number;
      drift: number; driftSpd: number; life: number; flick: number; bone: boolean;
    };
    let particles: P[] = [];
    const COUNT = 56;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const spawn = (initial: boolean): P => ({
      x: rand(0, W),
      y: initial ? rand(0, H) : H + rand(0, 40),
      r: rand(0.6, 2.2),
      vy: rand(0.25, 0.85),
      vx: rand(-0.25, 0.25),
      drift: rand(0, Math.PI * 2),
      driftSpd: rand(0.005, 0.02),
      life: rand(0.4, 1),
      flick: rand(0, Math.PI * 2),
      bone: Math.random() < 0.22,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const init = () => {
      particles = Array.from({ length: COUNT }, () => spawn(true));
    };
    const frame = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.y -= p.vy;
        p.drift += p.driftSpd;
        p.x += p.vx + Math.sin(p.drift) * 0.3;
        p.flick += 0.08;
        const a = (0.35 + Math.sin(p.flick) * 0.3) * p.life;
        if (p.y < -10 || p.x < -20 || p.x > W + 20) Object.assign(p, spawn(false));
        const col = p.bone
          ? "236,230,216"
          : Math.random() < 0.5
          ? "245,76,38"
          : "255,122,60";
        ctx.beginPath();
        ctx.fillStyle = `rgba(${col},${Math.max(0, a).toFixed(3)})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(245,76,38,${(a * 0.5).toFixed(3)})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(frame);
    };

    resize();
    init();
    frame();
    const onResize = () => {
      cancelAnimationFrame(raf);
      resize();
      init();
      frame();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  /* ---------- Reveal ---------- */
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative h-[100svh] min-h-[600px] w-full overflow-hidden">
      {/* Video layer — franja derecha; se funde con el fondo compartido por los bordes */}
      <div
        className="absolute inset-y-0 right-0 z-0 w-full lg:w-[46%]"
        style={{
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, #000 20%, #000 80%, transparent 100%)",
          maskImage:
            "linear-gradient(90deg, transparent 0%, #000 20%, #000 80%, transparent 100%)",
        }}
      >
        <video
          ref={videoARef}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          autoPlay
          muted
          playsInline
        />
        <video
          ref={videoBRef}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: 0 }}
          muted
          playsInline
        />
        {/* Difuminado inferior del video (cinematográfico / legibilidad móvil) */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(14,13,12,0) 0%, rgba(14,13,12,.55) 60%, #0e0d0c 100%)",
          }}
        />
      </div>

      {/* Brasa sutil en la unión (solo desktop) */}
      <div
        className="pointer-events-none absolute inset-y-0 right-[46%] z-[1] hidden w-px lg:block"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(245,76,38,.35) 40%, rgba(245,76,38,.12) 72%, transparent 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full items-end pb-20 lg:items-center lg:pb-0">
        <div
          className={`reveal w-full px-6 md:px-12 lg:px-16 ${revealed ? "in" : ""}`}
        >
          <div className="mx-auto max-w-[1500px]">
            <div className="max-w-[680px] lg:max-w-[56%]">
              <p className="mb-6 font-mono text-[12px] uppercase tracking-[0.28em] text-ember md:text-[13px]">
                Miniaturas de colección · Warhammer 40.000
              </p>

              <h1 className="mb-6 font-gothic uppercase text-bone">
                <span
                  className="flicker block"
                  style={{ fontSize: "clamp(44px,8vw,104px)", lineHeight: 0.92 }}
                >
                  El Arsenal del Emperador
                </span>
                <span
                  className="flicker mt-3 block font-gothic text-ember"
                  style={{ fontSize: "clamp(18px,2.6vw,30px)", letterSpacing: "0.08em" }}
                >
                  {SITE.tagline}.
                </span>
              </h1>

              <p
                className="mb-9 font-display text-bone/70"
                style={{ fontSize: "clamp(18px,1.5vw,22px)", lineHeight: 1.7, maxWidth: 520 }}
              >
                Miniaturas originales y piezas de colección Warhammer&nbsp;40.000.
                Reserva próximos lanzamientos y coordina tu envío a todo el país
                por WhatsApp.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/tienda"
                  className="inline-flex items-center justify-center gap-2 bg-ember px-7 py-4 font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-ink transition-all duration-200 hover:-translate-y-px glow-accent"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Explorar catálogo
                </Link>
                <Link
                  href="/proximos-lanzamientos"
                  className="inline-flex items-center justify-center gap-2 border border-bone/40 px-7 py-4 font-display text-[15px] font-semibold uppercase tracking-[0.14em] text-bone transition-colors hover:border-bone hover:bg-bone/5"
                >
                  <span className="text-[9px] leading-none text-ember">●</span>
                  Reservar lanzamientos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex">
        <span className="font-mono text-[10px] tracking-[0.3em] text-bone/40">
          DESCIENDE
        </span>
        <span className="h-8 w-px animate-pulse bg-gradient-to-b from-ember to-transparent" />
      </div>
    </section>
  );
}
