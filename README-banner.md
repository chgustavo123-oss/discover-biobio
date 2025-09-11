---
type: "banner"
slug: "community-project"
title: "A Project Built in Community"
copy:
  lead: "This website is the result of the joint effort of students, faculty, the English Program and the School of Tourism and Hospitality at DUOC UC."
  body: |
    More than just an academic project, it represents our commitment to the sustainable development
    of tourism in the Bio Bío Region and to sharing its cultural and natural richness with the world.
  attribution: "With contributions from:"
i18n:
  es:
    title: "Un proyecto construido en comunidad"
    lead: "Este sitio es el resultado del esfuerzo conjunto de estudiantes, docentes, el Programa de Inglés y la Escuela de Turismo y Hospitalidad de DUOC UC."
    body: |
      Más que un proyecto académico, representa nuestro compromiso con el desarrollo sostenible
      del turismo en la Región del Biobío y con compartir su riqueza cultural y natural con el mundo.
    attribution: "Con la contribución de:"
attributionEntities:
  - "Students"
  - "Faculty"
  - "English Program"
  - "School of Tourism and Hospitality – DUOC UC"
  - "Graphic Design - Interfaces and Interactions"
theme:
  background: "#FFFFFF"
  text: "#111111"
  accents:
    primary: "#009A96"
    secondary: "#FFB71B"
layout:
  containerMaxWidth: "1200px"
  align: "center"
  paddingY: "64px"
cta:
  enabled: false
a11y:
  headingLevel: 2
  contrast: "AA"
  ariaLabel: "About this project"
  prefersReducedMotion: true
---

## Good Practices / Buenas prácticas

- **Propósito claro:** bloque informativo y breve (1 título + 1 lead + 1 párrafo).
- **Tono colaborativo:** resalta el trabajo conjunto sin jerarquías.
- **Semántica:** `<section role="region" aria-labelledby="banner-title">` y título con `<h2>`.
- **Legibilidad y contraste:** texto oscuro sobre fondo claro; enlaces siempre distinguibles.
- **Coherencia con el sistema de diseño:** usa los tokens del sitio (colores, espaciados, tipografías).
- **Responsive:** contenedor con ancho máximo y paddings adecuados en mobile; tamaños con `clamp()`.
- **Accesibilidad de movimiento:** respeta `prefers-reduced-motion` si hay elementos animables.
- **Rendimiento:** prioriza recursos ligeros (CSS/SVG), carga diferida cuando aplique.
