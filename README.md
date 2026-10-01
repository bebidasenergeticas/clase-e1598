# AUTOMATION SYSTEMS · From workflow → production

Experiencia web para impartir en vivo la clase final del módulo de **Automatización Básica** del grupo **E1598** de Top Learning (Semana 9).

Combina la **presentación oficial de Top Learning** (el PDF original, sin reconstruir), explicaciones 3D sincronizadas, storytelling con scroll, diagramas animados de workflows y herramientas para interactuar con el grupo.

## Stack

- React 19 + TypeScript + Vite
- Three.js + React Three Fiber + Drei (3D procedural, sin modelos externos)
- GSAP + ScrollTrigger (progreso de scroll y navegación) · Framer Motion (preguntas)
- PDF.js (`pdfjs-dist`) para el visor de la presentación oficial
- Zustand (estado de la UI) · fuentes locales con Fontsource (Space Grotesk, Inter, JetBrains Mono)

## Iniciar

```bash
npm install
npm run dev        # desarrollo → http://localhost:5173
npm run build      # build de producción en dist/
npm run preview    # sirve dist/ → http://localhost:4173
```

## Presentación oficial (PDF)

- Archivo: `public/assets/E1598_Semana9_Parte2_desde_Concluimos.pdf` (se copia tal cual a `dist/assets/`).
- Se carga una sola vez con PDF.js (`src/pdf/pdfDocument.ts`) y se muestra siempre desde el PDF original:
  - **01 · Presentación oficial**: visor completo (`src/pdf/OfficialViewer.tsx`) con anterior/siguiente, número de diapositiva, miniaturas, pantalla completa del visor y enlace al PDF.
  - **Diapositiva incrustada** (`SlidePane`) en las secciones 02, 03 y 06, sincronizada con la explicación visual.
  - **Overlay casi a pantalla completa** con la tecla **P** (o el botón "Ampliar"), pensado para compartir pantalla en Google Meet.
  - **Finalizar sesión** muestra la diapositiva oficial 12.
- Todo lo que no viene del PDF se marca como **COMPLEMENTO DEL PROFESOR** o **ADAPTACIÓN PEDAGÓGICA**.

## Atajos del profesor

| Tecla | Acción |
| --- | --- |
| `→` / `←` (o `PageDown` / `PageUp`) | Siguiente / anterior paso o sección |
| `Shift` + `→` / `←` | Saltar sección completa |
| `F` | Pantalla completa |
| `P` | Presentación oficial (abrir / cerrar) |
| `C` | Workflow Clinic |
| `Q` | Show me your workflow |
| `I` | Índice |
| `M` | Ocultar / mostrar el Teacher Dock |
| `Inicio` | Volver al inicio |
| `Esc` | Cerrar overlay / salir de Open Floor |

`→` avanza "pasos": beats de scroll en las secciones con storytelling, módulos en Herramientas, happy path → fallo → defensa en el Mundo Real, checks en el Launchpad y preguntas en Show me your workflow. Cuando una sección no tiene más pasos, pasa a la siguiente.

El **Teacher Dock** (abajo, semitransparente) tiene: anterior, siguiente, índice, presentación oficial, clínica, preguntas, animaciones on/off, pantalla completa, inicio y ocultar.

## Estructura

```
src/
  App.tsx                 composición de secciones (sin lógica de contenido)
  data/courseContent.ts   TODO el contenido pedagógico complementario
  pdf/                    PDF.js: carga, caché, visor, diapositiva incrustada, overlay
  sections/               una sección por archivo (00 Boot … 12 Cierre)
  scenes/                 escenas 3D (lazy) + scenes/common/kit.tsx (primitivas, Stage3D, encaje)
  clinic/                 Workflow Clinic (modelo + UI + estilos)
  components/             Teacher Dock, HUD, SceneSlot (lazy/fallback), FlowDiagram, badges…
  hooks/                  navegación, teclado, progreso de scroll, visibilidad
  store/ui.ts             estado global (animaciones, overlays, sección activa)
  styles/                 tokens, global, chrome (HUD/dock), secciones
```

## Editar los casos del E1598

En `src/data/courseContent.ts`, array `realCases`. Cada caso:

```ts
{
  tag: 'COSTOS',
  title: 'Seguimiento de costos',
  problem: '…',
  workflow: [
    { kind: 'trigger', label: '…' },   // trigger | action | condition | ai | human | output
    { kind: 'condition', label: '¿…?' },
    { kind: 'output', label: '…' },
  ],
  risk: '…',
  output: '…',
}
```

Añade, quita o reordena objetos; la pared y el diagrama animado se generan solos. En el mismo archivo están los checks del Launchpad, las preguntas de Show me your workflow, las 5 reglas, los fallos de "Break the workflow" y los textos de cada beat.

## Modificar la Workflow Clinic

- `src/clinic/clinicModel.ts`
  - `buildFlow()` decide la arquitectura que se dibuja (INPUT → PROCESS → [IA] → DECISION → pasos añadidos → [HUMANO] → ACTION → OUTPUT).
  - `buildHints()` genera las preguntas sugeridas (reglas simples, sin IA).
  - `addable` define los botones `+ ACTION`, `+ CONDITION`, `+ HUMAN`, `+ AI`.
  - `exampleClinic` es el caso de ejemplo.
- `src/clinic/WorkflowClinic.tsx` es la interfaz; `src/data/courseContent.ts → diagnostic16` las 16 preguntas de diagnóstico.
- Todo se guarda solo en el navegador (`localStorage`, clave `e1598-clinic-v1`); "Nuevo caso" lo limpia.

## Rendimiento y accesibilidad

- Escenas 3D cargadas de forma diferida; cada Canvas existe solo cerca del viewport y deja de renderizar fuera de pantalla o con overlays abiertos (presentación, Open Floor, fin de sesión).
- `dpr` limitado (baja a 1 si cae el rendimiento), geometrías procedurales ligeras, pocas partículas.
- `prefers-reduced-motion` y botón de animaciones on/off; fallback SVG si WebGL no está disponible.
- Navegación completa por teclado, estados de foco visibles y etiquetas ARIA.

## Publicación (GitHub Pages)

`vite.config.ts` usa `base: './'`, así que el mismo build funciona en local y en `https://<usuario>.github.io/clase-e1598/`. El workflow `.github/workflows/deploy-pages.yml` publica `dist/` en la rama `gh-pages` en cada push a `main` (Settings → Pages → *Deploy from a branch* → `gh-pages` / root).
