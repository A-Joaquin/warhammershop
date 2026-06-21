# Scroll horizontal con parallax unificado — Cómo está construido

> Documentación del intro de la home (`components/intro-scroll.tsx`).
> Objetivo: que al hacer scroll **vertical** la página se desplace **de lado**
> (hero → mapa → galería) como una sola escena continua, y recién al terminar
> siga hacia abajo. Stack: **Next.js + React + GSAP (ScrollTrigger + MotionPathPlugin)**.

---

## 1. La idea en una frase

Tenemos una **tira horizontal** (un "riel") con varios paneles puestos uno al
lado del otro. La sección se **fija en pantalla** (pin) mientras dura el scroll, y
ese scroll vertical se convierte en un **desplazamiento horizontal** del riel.
Cuando el riel termina su recorrido, se suelta el pin y la página sigue normal.

```
Scroll del usuario (vertical)  ──►  traducido a  ──►  translateX del riel (horizontal)
```

---

## 2. La estructura HTML (riel pineado)

```
<section> (rootRef)                      ← contenedor general
  <div> (pinRef)  position: relative; h-screen; overflow-hidden
    <div> bgWorld   absolute inset-0; z-0   ← FONDO COMPARTIDO (no se mueve con el riel)
    <div> (trackRef) flex; w-[272vw]; z-10  ← EL RIEL (esto es lo que se desplaza)
        <div> Panel 1 — Hero (w-screen)
        <div> Panel 2 — Mapa (w-screen)
        <div> Panel 3 — Galería (w-screen, con margen negativo para solapar)
```

Claves:
- Cada panel mide `w-screen` (100vw) → ocupa una pantalla completa.
- El riel mide la suma de los paneles (`w-[272vw]`) y **desborda** el `pinRef`,
  que lo recorta con `overflow-hidden`.
- El **bgWorld** vive en el `pinRef` (NO dentro del riel), por eso queda fijo
  detrás de todo y es el mismo para los tres paneles → unifica la escena.

---

## 3. El "pin + scrub" de GSAP (el corazón)

```ts
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: pinRef.current,
    start: "top top",      // empieza cuando el tope del panel toca el tope de la ventana
    end: "+=4800",         // dura 4800px de scroll (cuánto hay que rodar la rueda)
    pin: true,             // CLAVA la sección en pantalla durante ese recorrido
    scrub: 1,              // ata la animación al scroll (1 = suavizado de 1s)
    anticipatePin: 1,
    invalidateOnRefresh: true, // recalcula valores en función de px al redimensionar
  },
});
```

- `pin: true` → la sección se queda quieta en pantalla; GSAP crea un "spacer"
  invisible de `end` px para que el scroll tenga recorrido.
- `scrub` → en vez de reproducirse sola, la timeline **avanza y retrocede con el
  scroll**. Si subes la rueda, la animación va para atrás.
- Todo lo que metas en `tl` (con posiciones de 0 a ~1) se reparte a lo largo de
  esos 4800px.

---

## 4. Las fases de la timeline

Las posiciones son fracciones del recorrido total (no segundos reales, porque con
`scrub` lo que manda es el scroll):

```ts
const vwUnit = () => window.innerWidth / 100;   // 1vw en px, recalculable

// FASE 1 (0 → 0.13): pan del loop al mapa
tl.to(track, { x: () => -88.5 * vwUnit(), duration: 0.13 }, 0);

// FASE 2 (0.17 → ~0.33): misiles desde Cochabamba (ver §6)
// ...

// FASE 3 (0.42 → 0.50): pan del mapa a la galería
tl.to(track, { x: () => -126 * vwUnit(), duration: 0.08 }, 0.42);

// FASE 4 (0.52 → 0.99): ciclo de imágenes con transición cyberpunk (ver §7)
// ...
```

### Por qué `x` en píxeles y no `xPercent`
`xPercent` es relativo al **ancho del propio riel**. Si cambias el ancho del riel
(por ejemplo al solapar paneles con margen negativo), TODOS los porcentajes se
descuadran. Usando `x: () => -126 * vwUnit()` el desplazamiento se mide en
**vw absolutos**, independiente del ancho del riel. Con `invalidateOnRefresh` se
recalcula al cambiar el tamaño de la ventana.

---

## 5. Unificación: que se vea UNA escena, no 3 diapositivas

Esto fue lo más importante para que no se sintieran "pantallas aparte":

### 5.1 Fondo compartido (`bgWorld`)
- Un solo `<div>` fijo en el `pinRef`, **detrás** del riel (`z-0`), con
  `bg-ink` (#0e0d0c) + un **canvas de brasas** + una viñeta radial.
- Los paneles del mapa y la galería son **transparentes** (sin `bg-*`), así el
  bgWorld se ve a través de ellos → los tres tramos comparten exactamente el
  mismo fondo.

### 5.2 El video del hero se funde con el fondo (máscara)
El borde del video chocaba de golpe con el fondo del mapa (colores distintos).
Solución: una **máscara CSS** que desvanece los bordes del video a transparente,
dejando ver el bgWorld detrás → el video "flota" en el mismo fondo y no hay
costura:

```ts
style={{
  WebkitMaskImage:
    "linear-gradient(90deg, transparent 0%, #000 20%, #000 80%, transparent 100%)",
  maskImage:
    "linear-gradient(90deg, transparent 0%, #000 20%, #000 80%, transparent 100%)",
}}
```
(De 0→20% y de 80→100% el video se vuelve invisible y aparece el fondo común.)

### 5.3 Paneles que se solapan (margen negativo)
Para que la galería empiece **justo después** del mapa (y no a una pantalla de
distancia), el panel de la galería lleva un **margen negativo**:

```html
<div class="... lg:w-screen lg:-ml-[42vw]">  <!-- la galería se mete 42vw sobre el mapa -->
```
Como la zona derecha del mapa está vacía, la galería ocupa ese hueco. El ancho
del riel se ajusta (`w-[272vw]` = 100+100+100−28… según el solape).

---

## 6. Los misiles (servo-cráneos) — MotionPathPlugin

Cada departamento tiene un **arco** (un `<path>` SVG curvo desde Cochabamba). El
misil viaja por ese arco con `MotionPathPlugin`, mientras el arco se "dibuja" con
`strokeDashoffset`:

```ts
const len = arc.getTotalLength();
gsap.set(arc, { strokeDasharray: len, strokeDashoffset: len }); // arco oculto
tl.to(missile, { motionPath: { path: arc, autoRotate: false }, duration: FLY }, p)
  .to(arc, { strokeDashoffset: 0, duration: FLY }, p)            // traza la estela
  .to(impact, { scale: 1, autoAlpha: 1, ... }, p + FLY)          // destello al caer
  .to(marker, { autoAlpha: 1, ... }, p + FLY);                   // enciende el depto
```
El servo-cráneo es un `<image href="/servo.png">` dentro del grupo `.missile`.
`autoRotate: false` → va siempre derecho.

---

## 7. Transición "cyberpunk" de la galería

Las 7 imágenes están apiladas (`.gimg`, `position: absolute`). Al scrollear, cada
una hace **glitch-out** y la siguiente **glitch-in**, con:
- **Aberración cromática RGB**: `filter: drop-shadow(4px 0 #ff00d4) drop-shadow(-4px 0 #00e5ff)`
  (sombras cian/magenta separadas).
- **Saltos** horizontales + `skewX` con `ease: "steps(...)"` (sensación digital).
- Encima del visor: **scanlines** (gradiente repetido) + una **barra de escaneo**
  animada + esquinas HUD.

```ts
tl.to(A, { x: -8, skewX: 6, filter: CA_OUT, ease: "steps(1)" }, p)
  .to(A, { autoAlpha: 0, ... }, p + 0.01)
  .set(B, { autoAlpha: 1 }, p + 0.008)
  .fromTo(B, { x: 8, filter: CA_IN }, { x: 0, filter: "none", ease: "steps(3)" }, p + 0.01);
```

---

## 8. Responsive y accesibilidad

- **Móvil / `prefers-reduced-motion`**: no hay riel ni pin. Se detecta con
  `matchMedia` y, si NO es desktop, se hace `return` antes de crear el
  ScrollTrigger. Los paneles se apilan en vertical (clases `lg:` controlan el modo
  horizontal) y se muestra el **estado final** (mapa con todo encendido, galería
  visible). Así el celular no sufre un pin horizontal incómodo.
- GSAP se carga con **import dinámico** (`await import("gsap")`) dentro de un
  `useEffect`, para no engordar el bundle inicial (mejor LCP).
- Limpieza con `gsap.context(... , rootRef)` + `ctx.revert()` al desmontar.

---

## 9. Errores/lecciones que aprendimos en el camino

1. **`xPercent` se rompe al cambiar el ancho del riel** → usar `x` en vw.
2. **Paneles opacos tapan el fondo compartido** → hacerlos transparentes.
3. **Un PNG no implica transparencia**: las imágenes traían fondo verde/“matte”
   pintado en los píxeles (se quita con chroma key o se ignora).
4. **El video chocaba con el fondo** → enmascararlo para fundirlo, no taparlo.
5. **HMR/caché**: tras cambios grandes, recargar con `Ctrl+Shift+R`.
6. Para depurar sin adivinar, se tomaron **capturas headless con Chrome** a
   distintas profundidades de scroll y se midió el `transform` del riel.

---

## 11. Cómo mover / intercambiar el texto y las imágenes

Cada panel (mapa y galería) es una **fila flex** con dos columnas: una de **texto**
y otra de **imagen**. Todo se controla con clases de Tailwind. Mapa mental:

```
PANEL (toda la pantalla)            ← clase  lg:-ml-[28vw]   (cuánto se acerca/aleja del vecino)
  └─ CONTENEDOR (flex row)          ← clases lg:justify-*  lg:gap-*  lg:max-w-[940px]
       ├─ COLUMNA TEXTO             ← clases lg:w-[36%]   lg:-ml-[3vw]
       └─ COLUMNA IMAGEN            ← clases lg:w-[52%]   max-w-[min(74vh,540px)]
```

Y aparte, dónde **reposa la cámara** (mueve TODO el panel en pantalla):
```ts
tl.to(track, { x: () => -126 * vwUnit() }, 0.42);   // FASE 3 (galería)
tl.to(track, { x: () => -88.5 * vwUnit() }, 0);      // FASE 1 (mapa)
```

### Recetario (intención → qué clase tocar)

| Quiero… | Cambia esto |
|---|---|
| Mover TODO el panel **a la izquierda** (acercar al vecino) | `lg:-ml-[28vw]` → más grande, p.ej. `lg:-ml-[40vw]` |
| Mover TODO el panel **a la derecha** (alejar) | `lg:-ml-[28vw]` → más chico, p.ej. `lg:-ml-[15vw]` |
| Recorrer la composición en pantalla sin tocar el solape | el valor del pan: `-126 * vwUnit()` (más negativo = más a la izq.) |
| **Intercambiar** texto e imagen (texto→derecha, imagen→izq.) | en el CONTENEDOR: `lg:flex-row` → `lg:flex-row-reverse` |
| Separar más el texto de la imagen | `lg:gap-8` → `lg:gap-16` (o `lg:justify-between`) |
| Texto **más al centro** | en el CONTENEDOR `lg:justify-start` → `lg:justify-center`, o subir el `gap` |
| Texto más ancho / angosto | COLUMNA TEXTO: `lg:w-[36%]` (sube/baja el %) |
| Imagen más grande / chica | COLUMNA IMAGEN: `lg:w-[52%]` y `max-w-[min(74vh,540px)]` |
| Que el texto sangre (se meta) hacia la izquierda | COLUMNA TEXTO: `lg:-ml-[3vw]` (más negativo = más a la izq.) |
| Ancho total del bloque (texto+imagen juntos) | CONTENEDOR: `lg:max-w-[940px]` |

### Ejemplo: intercambiar de lugar (imagen a la izquierda, texto a la derecha)

1. En el `<div>` CONTENEDOR de la galería, cambia `lg:flex-row` por
   `lg:flex-row-reverse`.
2. Ojo con los sangrados: el texto tiene `lg:-ml-[3vw]` pensado para cuando está
   a la izquierda; si lo mandas a la derecha quizá quieras quitarlo o cambiarlo
   por `lg:-mr-[3vw]`.
3. Vuelve a mirar el reposo de cámara (`-126 * vwUnit()`) por si hay que recorrer
   un poco para que la imagen no se corte en el borde.

> **Regla de oro**: `-ml-[..vw]` mueve el panel **respecto a su vecino** (en el riel),
> y el valor del **pan** mueve **dónde queda la cámara**. Con esos dos controlas
> casi todo el encuadre. Las `w-[..%]` reparten el ancho entre texto e imagen.

---

## 10. Archivos relevantes

- `components/intro-scroll.tsx` — todo el riel, el fondo, los misiles y la galería.
- `components/hero.tsx` — el panel 1 (video enmascarado + copy).
- `app/globals.css` — keyframes `cyberscan`, utilidades de fuente y tokens 40k.
- `public/` — `mapabolivia.png`, `servo.png`, `transicion/c1..c7.webp`, `video/hero-loop.mp4`.

---

## 12. Apéndice técnico — cada parámetro explicado

> Referencia exhaustiva de `components/intro-scroll.tsx` y la parte del video de
> `components/hero.tsx`. Aquí se explica **qué hace cada número y cada palabra**.

### 12.1 Constantes de geometría del mapa

```ts
const ORIGIN = { x: 41, y: 54 };           // Cochabamba, en el sistema 0..100 del SVG
const DEPTS = [ { name, x, y }, ... ];      // los 8 destinos (mismas coordenadas 0..100)
```
- El SVG del mapa usa `viewBox="0 0 100 100"`: las coordenadas son **porcentajes**
  del ancho/alto del mapa, NO píxeles. Por eso funcionan a cualquier tamaño.
- `x` crece hacia la **derecha**, `y` crece hacia **abajo** (estándar SVG).
- Para mover un departamento: cambias su `x`/`y`. Se calibraron mirando el mapa
  con una cuadrícula de coordenadas encima.

```ts
function arcPath(o, t) {
  const mx = (o.x + t.x) / 2;              // punto medio X entre origen y destino
  const my = (o.y + t.y) / 2;              // punto medio Y
  const dist = Math.hypot(t.x - o.x, t.y - o.y);   // distancia recta origen→destino
  const lift = Math.min(40, Math.max(10, dist * 0.6));  // altura del arco
  return `M ${o.x} ${o.y} Q ${mx} ${my - lift} ${t.x} ${t.y}`;
}
```
- Devuelve un **path SVG curvo** tipo "lob" (parábola).
  - `M x y` = *move to* (arranca en Cochabamba).
  - `Q cx cy x y` = curva cuadrática de Bézier: `(cx,cy)` es el **punto de control**
    y `(x,y)` el destino.
- `lift` = cuánto se eleva el punto de control **por encima** del punto medio
  (`my - lift`). Más `lift` = arco más alto.
  - `dist * 0.6` → la altura es proporcional a la distancia (arcos largos suben más).
  - `Math.max(10, ...)` → **piso de 10** para que destinos cercanos (Beni) no hagan
    un arco plano feo. (Antes era 14 y el de Beni hacía un lazo demasiado alto.)
  - `Math.min(40, ...)` → **techo de 40** para que los muy lejanos no se disparen.

### 12.2 Carga de GSAP y limpieza

```ts
const { gsap } = await import("gsap");                 // import DINÁMICO (no entra al bundle inicial)
const { ScrollTrigger } = await import("gsap/ScrollTrigger");
const { MotionPathPlugin } = await import("gsap/MotionPathPlugin");
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);  // hay que registrar los plugins una vez
```
- `let killed = false` + `if (killed) return` → evita aplicar animaciones si el
  componente se desmontó mientras cargaba GSAP (React 18/19 monta dos veces en dev).
- `gsap.context(() => {...}, rootRef)` → agrupa todas las animaciones bajo `rootRef`.
- `ctx.revert()` (en el cleanup) → **deshace todo** (mata tweens, ScrollTriggers y
  restaura estilos) al desmontar.
- `gsap.utils.selector(rootRef)` → crea una función `q(".clase")` que busca **solo
  dentro** de `rootRef` y devuelve un array de elementos.

### 12.3 Pulso del origen (Cochabamba), siempre activo

```ts
gsap.to(q(".origin-ring"), {
  scale: 1.9,          // crece hasta 1.9x su tamaño
  opacity: 0,          // mientras se desvanece
  duration: 1.8,       // 1.8s por pulso
  repeat: -1,          // infinito
  ease: "power1.out",  // rápido al inicio, lento al final
  transformOrigin: "center",
  svgOrigin: "41 54",  // ESCALA desde el punto (41,54) del SVG, no desde 0,0
});
```
- `svgOrigin` es clave en SVG: sin él, `scale` escalaría desde la esquina (0,0).
- Esta animación **NO** está atada al scroll (corre sola, como un latido).

### 12.4 Detección de desktop / accesibilidad

```ts
const desktop =
  window.matchMedia("(min-width: 1024px)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```
- Solo se arma el scroll horizontal en **pantallas ≥1024px** y si el usuario **no**
  pidió reducir movimiento.
- Si NO es desktop → se pone el **estado final estático** (arcos dibujados a opacidad
  0.32, marcadores visibles, galería visible, outro visible) y se hace `return`
  ANTES de crear el ScrollTrigger. En móvil los paneles se apilan en vertical por CSS.

### 12.5 Estado inicial (antes de animar)

```ts
const len = arc.getTotalLength();                 // largo real del path en unidades SVG
gsap.set(arc, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
gsap.set(missiles[i], { autoAlpha: 0 });
gsap.set(impacts[i], { autoAlpha: 0, scale: 0, transformOrigin: "center", svgOrigin: `${d.x} ${d.y}` });
gsap.set(markers[i], { autoAlpha: 0.18 });
```
- **Truco de "dibujar la línea"**: `strokeDasharray = len` hace que el guion del
  trazo mida todo el path; `strokeDashoffset = len` lo **empuja fuera** → la línea
  empieza invisible. Animar el offset a `0` la "dibuja".
- `autoAlpha` = `opacity` + `visibility` (a 0 también pone `visibility:hidden`,
  así no captura clics).
- `impacts` empiezan en `scale:0` (el destello nace de la nada en su `svgOrigin`).
- `markers` empiezan a `0.18` (apagados pero levemente visibles).
- Galería: `gimgs` todas a `autoAlpha:0` excepto la `[0]` a `1`; `gdots` a `0.25`
  excepto la `[0]` a `1`.

### 12.6 El ScrollTrigger (el "motor")

```ts
scrollTrigger: {
  trigger: pinRef.current,    // el elemento que se observa y se fija
  start: "top top",           // empieza cuando su borde superior toca el borde sup. de la ventana
  end: "+=4800",              // dura 4800px de scroll
  pin: true,                  // CLAVA pinRef en pantalla durante esos 4800px
  scrub: 1,                   // la timeline sigue al scroll, con 1s de suavizado
  anticipatePin: 1,           // evita un "salto" al fijar
  invalidateOnRefresh: true,  // recalcula valores function-based al redimensionar
}
defaults: { ease: "none" }    // por defecto, movimiento lineal (lo manda el scroll)
```
- `scrub: 1` (en vez de `true`) añade **inercia**: la animación persigue al scroll
  con ~1s de retraso suave, se siente más fluido.
- `end: "+=4800"` es el dial principal de **cuánto hay que rodar la rueda** para
  recorrer todo el intro. Subirlo = más lento; bajarlo = más rápido.

### 12.7 Las posiciones de la timeline (0.0 → ~1.0)

Cada tween se coloca con un **tercer argumento** = su posición en la timeline.
Como hay `scrub`, esas posiciones se mapean a fracciones de los 4800px:

| Fase | Posición | Qué pasa |
|---|---|---|
| 1 — pan al mapa | `0` → `0.13` | el riel se mueve a `-88.5vw` |
| intro del mapa entra | `0.08` | texto "Desde el corazón…" aparece |
| 2 — misiles | `0.17` → ~`0.33` | 8 misiles, escalonados |
| intro sale / outro entra | `0.32` / `0.35` | cambia a "Enviamos a todo el país" |
| 3 — pan a la galería | `0.42` → `0.50` | el riel se mueve a `-126vw` |
| 4 — galería | `0.52` → `0.99` | 7 imágenes con glitch |

### 12.8 FASE 1 y 3 — los desplazamientos (pans)

```ts
const vwUnit = () => window.innerWidth / 100;                 // 1vw en px (recalculable)
tl.to(trackRef.current, { x: () => -88.5 * vwUnit(), duration: 0.13 }, 0);   // pan 1
tl.to(trackRef.current, { x: () => -126  * vwUnit(), duration: 0.08 }, 0.42); // pan 3
```
- Se anima `x` (transform translateX) del **riel** en **píxeles** (función `-88.5 * vw`),
  NO `xPercent`. Razón: el riel cambia de ancho cuando solapamos paneles, y `xPercent`
  se descuadraría. En vw absolutos el encuadre es estable.
- `-88.5vw` = posición de reposo del **mapa** (deja ~11.5vw del loop asomando a la izq.).
- `-126vw` = posición de reposo de la **galería** (deja ~1/3 del mapa a la izq.).
- Son **funciones** `() => ...` para que `invalidateOnRefresh` las reevalúe al cambiar
  el tamaño de la ventana.

Las apariciones de texto:
```ts
tl.fromTo(introRef.current, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.06, ease: "power2.out" }, 0.08);
```
- `fromTo` define estado inicial → final. Entra desde `y:24` (24px abajo) y
  `autoAlpha:0` hasta su sitio. `power2.out` = desacelera al llegar.

### 12.9 FASE 2 — los misiles (lo más denso)

```ts
const M_START = 0.17, M_STEP = 0.02, M_FLY = 0.017;
// para cada departamento i:
const p = M_START + i * M_STEP;     // cada misil arranca 0.02 después del anterior (escalonado)
```
- `M_START` = cuándo dispara el primer misil. `M_STEP` = separación entre misiles
  (con 8 misiles ocupan de 0.17 a ~0.31). `M_FLY` = **duración de vuelo** de cada
  misil (0.017 → rápido).

La cadena por misil (todas en posición relativa a `p`):
```ts
tl.set(missiles[i], { autoAlpha: 1 }, p)                              // 1) aparece el servo-cráneo
  .to(missiles[i], { motionPath: { path: arc, autoRotate: false }, duration: M_FLY }, p) // 2) vuela por el arco
  .to(arc, { strokeDashoffset: 0, duration: M_FLY }, p)               // 3) traza la estela a la par
  .set(missiles[i], { autoAlpha: 0 }, p + M_FLY)                      // 4) desaparece al llegar
  .to(impacts[i], { autoAlpha: 1, scale: 1, duration: 0.025, ease: "power2.out" }, p + M_FLY - 0.008) // 5) destello
  .to(impacts[i], { autoAlpha: 0, duration: 0.05, ease: "power1.in" }, p + M_FLY + 0.02)  // 6) el destello se apaga
  .to(markers[i], { autoAlpha: 1, duration: 0.025 }, p + M_FLY - 0.008)  // 7) enciende el departamento
  .to(arc, { opacity: 0.32, duration: 0.1 }, p + M_FLY + 0.01);       // 8) la estela baja a 0.32 (queda tenue)
```
- **2) `motionPath`** (del MotionPathPlugin): mueve el grupo `.missile` siguiendo el
  `path` del arco. `autoRotate: false` → el servo-cráneo va **derecho**, no gira con
  la curva. El cráneo es `<image href="/servo.png">` con su "punta" en el (0,0) local.
- **5/6) impacto**: crece de `scale:0` a `1` (destello) en 0.025 y se apaga en 0.05.
  El `-0.008`/`+0.02` lo sincroniza con la llegada del misil.
- **8) la estela** no desaparece: queda a `opacity:0.32`, así al final se ven las 8
  rutas doradas desde Cochabamba (refuerza el mensaje de cobertura nacional).

### 12.10 FASE 4 — la galería cyberpunk

```ts
const G_START = 0.52, G_END = 0.99;
const slot = (G_END - G_START) / GALLERY.length;   // fracción de timeline por imagen (~0.067)
const CA_OUT = "drop-shadow(4px 0 #ff7a3c) drop-shadow(-4px 0 #ffd86b) saturate(1.6) contrast(1.3)";
const CA_IN  = "drop-shadow(-3px 0 #ff7a3c) drop-shadow(3px 0 #ffd86b) saturate(1.45)";
```
- **`CA_OUT` / `CA_IN` = la "aberración cromática"** (el efecto de bordes de color):
  - `drop-shadow(4px 0 #ff7a3c)` proyecta una copia **naranja** 4px a la derecha.
  - `drop-shadow(-4px 0 #ffd86b)` proyecta una copia **dorada** 4px a la izquierda.
  - Al estar separadas, parece que el canal de color se "raja" → look glitch.
  - `saturate` y `contrast` exageran el color durante el corte.
  - (Antes eran cian `#00e5ff` y magenta `#ff00d4`; se pasaron a naranja/oro.)

Por cada transición de imagen i (de A=anterior a B=siguiente), en `p = G_START + i*slot`:
```ts
// glitch-OUT de A (saltos en pasos = sensación digital)
tl.to(A, { x: -8, skewX: 6,  filter: CA_OUT, duration: 0.005, ease: "steps(1)" }, p)
  .to(A, { x: 10, skewX: -5, filter: CA_OUT, duration: 0.005, ease: "steps(1)" }, p + 0.005)
  .to(A, { x: 0,  skewX: 0,  autoAlpha: 0, filter: "none", duration: 0.01 }, p + 0.01);
// glitch-IN de B
tl.set(B, { autoAlpha: 1 }, p + 0.008)
  .fromTo(B, { x: 8, skewX: -6, filter: CA_IN }, { x: 0, skewX: 0, filter: "none", duration: 0.014, ease: "steps(3)" }, p + 0.01);
// indicadores (las barritas de abajo)
tl.to(gdots[i - 1], { autoAlpha: 0.25, duration: 0.01 }, p)
  .to(gdots[i],     { autoAlpha: 1,    duration: 0.01 }, p + 0.008);
```
- `x` (px) y `skewX` (grados de inclinación) crean el **salto/desgarro** lateral.
- `ease: "steps(1)"` / `"steps(3)"` → el cambio ocurre en **saltos discretos** (no
  suave), que es lo que da el aspecto "digital roto".
- `filter: "none"` al final limpia la aberración → la imagen siguiente queda nítida.

### 12.11 El canvas de brasas (fondo compartido)

```ts
const COUNT = 70;                         // nº de partículas
const dpr = Math.min(devicePixelRatio || 1, 2);  // nitidez en retina, tope 2 (rendimiento)
// cada partícula (spawn):
r: 0.6–2.2     // radio
vy: 0.25–0.85  // velocidad de subida (y disminuye → suben)
vx: -0.25–0.25 // deriva horizontal
drift/driftSpd // oscilación senoidal lateral (Math.sin(drift)*0.3)
life: 0.4–1    // multiplica el alfa (unas más tenues que otras)
flick: senoide // parpadeo del brillo
bone: 20%      // 20% son color "hueso" (236,230,216); el resto naranja/naranja-claro
```
- En cada frame: `p.y -= p.vy` (sube), `p.x += deriva`, alfa = `(0.3 + sin(flick)*0.28) * life`.
- Si la partícula sale por arriba o por los lados, se **recicla** (`spawn` abajo otra vez).
- `shadowBlur = 8` + `shadowColor` naranja → cada brasa tiene un halo.
- **Importante**: estos colores están **hardcodeados** (`245,76,38`), por eso el
  **menú de color NO los cambia** (son "efecto de scroll").
- Vive en un `<canvas>` fijo en `pinRef` (no se mueve con el riel) → es el **mismo
  fondo** para los 3 paneles = unificación.

### 12.12 La estructura JSX y el porqué de cada clase

```html
<section bg-ink>                                  <!-- raíz -->
  <div pinRef: lg:h-screen lg:overflow-hidden>    <!-- lo que se fija y recorta -->
     <div absolute inset-0 z-0 bg-ink>            <!-- bgWorld (canvas brasas + viñeta) -->
        <canvas/>                                 <!-- brasas -->
        <div radial-gradient .. rgba(14,13,12,0.85)/> <!-- viñeta: oscurece bordes -->
     <div trackRef: z-10 lg:w-[272vw] lg:flex-row> <!-- EL RIEL -->
        <div lg:w-screen> <Hero/> </div>          <!-- Panel 1 (100vw) -->
        <div lg:w-screen> ...mapa... </div>        <!-- Panel 2 (100vw) -->
        <div lg:w-screen lg:-ml-[30vw]> ...galería... </div>  <!-- Panel 3, solapado -30vw -->
```
- `pinRef` solo es `h-screen/overflow-hidden` en `lg:` → en móvil no se fija ni recorta.
- `trackRef` ancho `272vw`: 3 paneles de 100vw = 300vw, **menos** el solape de la
  galería (`-ml-[30vw]`) ≈ 270–272vw. (El valor exacto se ajusta a ojo con capturas.)
- **Panel 2 (mapa)** interno: `lg:justify-start` (contenido a la izquierda) +
  `lg:-ml-[1vw]` en el texto + columnas `lg:w-[36%]` (texto) y `lg:w-[54%]` (mapa).
- **Panel 3 (galería)**: `lg:-ml-[30vw]` mete el panel sobre la zona vacía del mapa;
  `lg:max-w-[940px]` limita el ancho del contenido para que la figura no se corte al
  compartir pantalla con el mapa; texto `lg:w-[36%]`, visor `lg:w-[52%]`.

### 12.13 El SVG del mapa (capas, de atrás hacia adelante)

```html
<svg viewBox="0 0 100 100" overflow-visible>
  <defs><radialGradient id="goldGlow"> ... </radialGradient></defs>  <!-- brillo dorado reutilizable -->
  .arc      → <path stroke="#c9a24b" strokeWidth=0.5 .../>   <!-- las trayectorias (8) -->
  .marker   → <g><circle r=2.6 anillo/><circle r=1.3 punto/></g>  <!-- destino encendible (8) -->
  .impact   → <g><circle r=4.5 anillo/><circle r=2 glow/></g>     <!-- destello al caer (8) -->
  .missile  → <g><image href="/servo.png" x=-7 y=-7 width=14 height=14/></g>  <!-- el servo-cráneo (8) -->
  .origin-ring → <g> 3 círculos en Cochabamba </g>           <!-- el latido del origen -->
```
- Todo en unidades 0..100. El servo mide `14x14` y se centra en su (0,0) con
  `x=-7 y=-7` (así su centro sigue exactamente el arco).
- `overflow-visible` permite que el destello/halo se salga del borde sin recortarse.
- Colores `#c9a24b` (oro) y `#ffe9a8` (oro claro) están **hardcodeados** → no los
  toca el menú de color (son parte del efecto del scroll).

### 12.14 El video del hero enmascarado (en `hero.tsx`)

```ts
style={{
  WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 20%, #000 80%, transparent 100%)",
  maskImage:       "linear-gradient(90deg, transparent 0%, #000 20%, #000 80%, transparent 100%)",
}}
```
- Una **máscara** desvanece el video: de 0→20% (borde izq.) y de 80→100% (borde der.)
  el video se vuelve **transparente** y deja ver el `bgWorld` (negro+brasas) detrás.
- Resultado: el video "flota" en el mismo fondo y **no hay costura** dura con el mapa.
- Crossfade del loop (también en `hero.tsx`): `CROSSFADE_MS = 700` (duración del
  fundido entre los dos `<video>`), `TRIGGER_BEFORE_END = 0.7` (lanza el segundo
  video 0.7s antes de que termine el primero, para que el bucle sea invisible).

### 12.15 Resumen de "diales" más útiles

| Quiero cambiar… | Toco… | Dónde |
|---|---|---|
| Velocidad total del intro | `end: "+=4800"` | scrollTrigger |
| Suavidad del scroll | `scrub: 1` | scrollTrigger |
| Reposo del mapa | `-88.5 * vwUnit()` | FASE 1 |
| Reposo de la galería | `-126 * vwUnit()` | FASE 3 |
| Velocidad de los misiles | `M_FLY = 0.017` | FASE 2 |
| Separación entre misiles | `M_STEP = 0.02` | FASE 2 |
| Altura de los arcos | `dist * 0.6` y `max(10, …)` | `arcPath` |
| Posición de un departamento | su `{x, y}` | `DEPTS` |
| Intensidad del glitch | `x`, `skewX`, `steps()` | FASE 4 |
| Color del glitch | `CA_OUT` / `CA_IN` | FASE 4 |
| Densidad de brasas | `COUNT = 70` | canvas |
| Solape galería↔mapa | `lg:-ml-[30vw]` | Panel 3 |
| Difuminado de los bordes del video | la `maskImage` 20%/80% | `hero.tsx` |
