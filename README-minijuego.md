---
type: "mini-game"
slug: "duoc-logo-rotator"
title: "DUOC Logo — Rotation Puzzle"
summary: "Puzzle de rotación por celdas para recomponer el logo de DUOC."
asset:
  src: "assets/img/logo-turismo-ingles-arreglo.svg"      # ruta del logo
  aspectRatio: "auto"                   # o "16:9" si corresponde
  licenseNote: "Uso educativo/institucional"

grid:
  default: "3x3"
  options: ["3x3","4x4","6x6","3x6","6x3"]

mechanics:
  interaction: "Cada clic/tap (o Enter/Espacio) rota la celda +90°."
  rotationStep: 90
  startState: "Rotaciones aleatorias; garantizar que no inicie resuelto."
  swapPieces: false                     # las piezas no se mueven ni intercambian
  movePieces: false
  winCondition: "Todas las celdas con rotación 0° (mod 360)."
  feedback: ["mensaje de avance opcional", "mensaje de completado"]

controls:
  difficultySelect: true
  shuffleButton: true
  counters:
    moves: true
    time: true
  statusLive: true                      # mensajes en vivo (aria-live)

accessibility:
  roles:
    regionLabel: "Rompecabezas por rotación del logo DUOC"
    grid: true
    gridcell: true
  keyboard:
    focus: "Tab recorre celdas"
    actions: ["Enter", "Space"]         # rota la celda enfocada
  screenReader:
    announceMoves: true
    completionMessage: "Logo completado"
  reducedMotion: "Respetar preferencia del usuario"

instrumentation:
  events: ["start", "shuffle", "move", "solve"]
  telemetry: false

layout:
  placement: "sidebar"                  # pensado para ir junto a la sección “Sobre el proyecto”
  maxWidth: "560px"
  responsive: true

copy:
  es:
    heading: "Arma el logo DUOC"
    instructions: "Gira cada cuadrado 90° hasta orientar correctamente la imagen."
    solved: "¡Logo completado!"
    labels:
      difficulty: "Dificultad"
      shuffle: "Mezclar"
      moves: "Movidas"
      time: "Tiempo"
  en:
    heading: "Assemble the DUOC logo"
    instructions: "Rotate each square by 90° until the image is correctly oriented."
    solved: "Logo completed!"
    labels:
      difficulty: "Difficulty"
      shuffle: "Shuffle"
      moves: "Moves"
      time: "Time"

notes: |
  - Las celdas muestran recortes del mismo archivo del logo.
  - La grilla puede adaptarse a las dimensiones del logo (por ejemplo 3×6 si es más apaisado).
  - Evitar estados imposibles: si el aleatorio queda en 0° para todas, forzar al menos una rotación.
  - El juego termina cuando todas las rotaciones están alineadas (0°, 360°, etc.).
---

Descripción
-----------
Juego breve y accesible: el usuario recompone el logo de DUOC rotando celdas en una grilla seleccionable (de 3×3 a 6×6). Ideal para acompañar la sección “Sobre el proyecto” como una interacción simple y educativa que no requiere arrastrar piezas ni animaciones complejas.
