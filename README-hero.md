---
type: "hero-background"
style: "organic"
animated: true
aspectRatio: "16:9"
resolution: "high"
implementation:
  technologies: ["html", "css", "js (opcional)"]
  approach: "CSS-first; JS solo para randomizar posiciones y/o parallax suave"
  selectors:
    container: ".hero"
    layerClass: ".hero-blob"
colors:
  background: "#FFFFFF"
  shapesBase: "#009A96"
  shapesVariants:
    - "#0FB3AE"   # variante clara (opcional)
    - "#07847F"   # variante oscura (opcional)
shapes:
  form: "organic blobs"
  count: 4
  sizeRange: ["22vw", "36vw"]    # tamaños sugeridos por blob
  opacityRange: [0.10, 0.25]
  blurRangePx: [28, 60]
  placement:
    - "top-left"
    - "top-right"
    - "bottom-left"
    - "bottom-right"
animation:
  intent: "sutil, relajante"
  technique: "CSS keyframes (translate/scale/opacity + filter:blur); opcional parallax con JS"
  properties: ["transform", "opacity", "filter"]
  durationRangeSec: [24, 36]     # cada blob puede variar dentro de este rango
  easing: "cubic-bezier(0.22, 1, 0.36, 1)"  # easeOutBack suave
  direction: "alternate"
  stagger: true                   # desfase entre blobs
  driftRangePx: [16, 46]          # desplazamiento máx (x/y) por ciclo
  scaleRange: [0.92, 1.08]
  parallax:
    enabled: true
    strengthPx: 8                # desplazamiento total en scroll
    axis: "both"
  prefersReducedMotion: true      # respeta @media (prefers-reduced-motion)
performance:
  gpuAcceleration: true           # transform/opacity para compositing
  willChange: ["transform", "opacity", "filter"]
  targetFPS: 60
  layers: 3
  zIndexOrder: "blobs debajo del contenido del hero"
fallback:
  staticImage: "/assets/img/hero-bg-static.png"
  alt: "Fondo blanco con formas verdes difuminadas"
a11y:
  contrast: "AA"
  notes:
    - "El contenido (título/CTA) debe mantener contraste suficiente (#000 sobre #FFF)."
    - "Pausar animación si el usuario prefiere menos movimiento."
description: |
  Fondo para hero section con canvas blanco y formas verdes orgánicas difuminadas
  en las cuatro esquinas. Las formas se mueven lentamente (drift) y cambian
  sutilmente de escala y opacidad para crear un efecto relajante. No contiene
  texto ni iconos; solo el fondo abstracto.

implementationNotes: |
  CSS (sugerido):
    .hero { position: relative; overflow: clip; background:#FFFFFF; }
    .hero-blob {
      position: absolute; border-radius: 50%;
      background: radial-gradient(circle at 40% 40%, var(--c) 0%, transparent 60%);
      filter: blur(var(--blur,40px));
      opacity: var(--o,0.18);
      transform: translate3d(0,0,0) scale(var(--s,1));
      animation: drift var(--t,30s) var(--e,cubic-bezier(0.22,1,0.36,1)) infinite alternate;
      will-change: transform, opacity, filter;
    }
    @keyframes drift {
      from { transform: translate3d(var(--x1,0), var(--y1,0), 0) scale(var(--s1,1)); }
      to   { transform: translate3d(var(--x2,24px), var(--y2,24px), 0) scale(var(--s2,1.06)); }
    }
    @media (prefers-reduced-motion: reduce) {
      .hero-blob { animation: none; }
    }

  JS (opcional):
    - Al cargar, asignar a cada .hero-blob variables CSS personalizadas:
      --c (color), --blur, --o (opacidad), --t (duración),
      --x1/--y1 y --x2/--y2 (rango de drift), --s1/--s2 (escala).
    - Añadir parallax suave: mover ligeramente los blobs con scroll (máx ±8px).
