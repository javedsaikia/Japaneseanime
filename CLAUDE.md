# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AKATSUKI STUDIO** — fictional Japanese animation studio landing page. The defining feature is a **hybrid navigation system**: users can navigate the site hands-free via eye-gaze tracking (WebGazer.js) or hand gestures (MediaPipe), alongside standard touch/click. All camera/ML processing runs client-side — no data leaves the browser.

Brand identity: dark cinematic anime aesthetic, "Sakura Dawn Epic" color palette (deep indigo → violet → rose → ember gold), Righteous display font + Poppins body, procedural sakura petals, torii gate SVG emblem.

## Run Commands

```powershell
npm run dev      # dev server — http://localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

**Required for gaze/gesture features**: HTTPS or `localhost` + a physical webcam. Camera permission prompt fires on first enable.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 + custom "Sakura Dawn" palette |
| Animation | Framer Motion v11 |
| Eye tracking | WebGazer.js v3 (dynamically imported, client-only) |
| Hand tracking | MediaPipe Tasks-Vision v0.10.18 (dynamically imported) |
| Fonts | Google Fonts: Righteous (display), Poppins (body) |

## Folder Structure

```
app/
  layout.tsx          Root layout — fonts, metadata, viewport
  page.tsx            Single page: HybridNavProvider → HybridHero + ScrollSections
  globals.css         Base styles + atmosphere layer classes (.sky-gradient, .god-rays,
                      .mist, .vignette, .film-grain, .lens-flare, .gaze-dot)

components/
  HybridHero.tsx      Full-screen hero section — torii emblem, nav, CTAs, scroll parallax
  fx/
    HeroBackground    Layered atmosphere: sky gradient → video → god-rays → orbs →
                      mist → sakura → lens flare → vignette → film grain
                      Mouse/touch parallax via Framer Motion spring values.
    SakuraCanvas      Procedural falling petals on <canvas> — no image assets,
                      DPR-aware, pauses when tab hidden, honors prefers-reduced-motion
  hybrid/             THE CORE SYSTEM (read this before touching nav behavior)
    types.ts          All shared types + tunables (DWELL_MS, PINCH_THRESHOLD, etc.)
    HybridNavProvider Context: owns all gaze/gesture state, dwell hit-test rAF loop,
                      target registry, and CustomEvent broadcast
    gazeEngine.ts     WebGazer wrapper — dynamic import, EMA smoothing, camera probe
    gestureEngine.ts  MediaPipe HandLandmarker — pinch=confirm, 3-finger=next,
                      palm-hold=menu, palm-swipe=scroll
    HybridButton      Button that auto-registers with the context; shows gaze halo +
                      SVG dwell ring; always works with mouse/touch too
    useHybridTarget   Hook to make any element a gaze/gesture target
    CalibrationOverlay 9-dot click calibration UI (fires when status === "calibrating")
    CameraSettingsPanel Toggle gaze/gesture on/off
    GestureToast      Transient feedback label ("Selected", "Next section", "Menu")
  sections/
    ScrollSections    3 sections rendered below the hero:
                      OriginalsSection → StudioSection → FinaleSection

tailwind.config.ts    Custom "Sakura Dawn Epic" palette — all color tokens defined here
public/               Static assets: blade.jpg, romance.jpg, history1.jpg, hero.jfif, etc.
                      NOTE: hero-reel.mp4 is referenced but not yet present
types/
  webgazer.d.ts       Hand-written type shim for WebGazer (no @types package exists)
```

## Custom Tailwind Tokens

Always use these tokens — never raw hex values in components.

```
Colors:
  dusk-950/900/800/700/600   deep indigo-violet backgrounds
  rose-glow (#ff5fa2)        hot pink glow / primary accent
  rose-400/300/200           lighter rose tints
  ember-gold (#ffcf8b)       warm gold for kickers, stats, icons
  ember-600/500/400          orange-ember gradient stops
  haze (#fff6fb)             near-white text on dark backgrounds

Typography:
  font-display               Righteous — headlines, kanji overlays, nav logo
  font-body                  Poppins — body text, labels, buttons

Shadows:
  shadow-glow-rose           hot-pink neon glow (primary CTA)
  shadow-glow-gold           warm gold glow (hover state, HybridButton gazed)
  shadow-glow-soft           diffuse rose ambient

Drop-shadows (text):
  drop-shadow-text-glow      rose glow on headlines
  drop-shadow-gold-glow      gold glow on ember-gold text
```

## Coding Conventions

**Component shape**: all interactive components are `"use client"`. Pure display components with no hooks can omit it.

**Framer Motion**: use `motion.*` wrappers; prefer `useScroll` + `useTransform` for scroll-linked effects, spring physics (`useSpring`) for smooth lag. Never `animate` with absolute pixel values when a transform percentage or `useTransform` range will do.

**Hybrid nav**: any new interactive element that should be reachable by gaze/gesture must:
1. Use `useHybridTarget<T>(id, onActivate)` to get `{ ref, isGazed, dwellProgress, pinching }`
2. Wire the same `onActivate` to `onClick` — touch/mouse must always work
3. Use a unique, stable string `id` (no dynamic indices)

**Dynamic imports**: WebGazer and MediaPipe are loaded via `import()` inside async functions — never at module top-level. This keeps them out of the server bundle entirely.

**Canvas**: `SakuraCanvas` pattern — `useEffect` owns the entire canvas lifecycle (resize, rAF loop, cleanup). Never touch canvas state outside that effect.

**Tunables in `types.ts`**: `DWELL_MS`, `PINCH_THRESHOLD`, `GAZE_SMOOTHING`, `GESTURE_COOLDOWN_MS`, `CALIBRATION_POINTS`. Adjust there, not inline.

**Window events**: global gestures broadcast as `CustomEvent` on `window` with the prefix `hybridnav:` (e.g. `hybridnav:next`). Components listen with `addEventListener` in `useEffect` and clean up on return.

## Known Issues

| File | Issue |
|---|---|
| `gestureEngine.ts:123` | `"home"` gesture type exists in `GlobalGestureType` but is never fired — only "next" and "toggle-menu" are emitted |
| `HybridHero.tsx:148` | All 4 nav buttons do identical `scrollBy(innerHeight)` — none target their named section |
| `ScrollSections.tsx:134` | `<img>` used instead of `next/image` — no optimization |
| `gestureEngine.ts:71` | MediaPipe WASM loaded from `cdn.jsdelivr.net`; model from `storage.googleapis.com` — external CDN at runtime |
| `public/` | `hero-reel.mp4` referenced in HeroBackground but file missing — gradient fallback is shown |

## Japanese / Anime Cultural Notes

**Kanji used in UI** — choose characters that match the section's emotional meaning:
- `暁` (akatsuki) — dawn, used as section background in Originals
- `魂` (tamashii) — soul, used in Studio section
- `刃` (ha/yaiba) — blade
- `宙` (chuu) — space/sky
- `侍` (samurai)

When adding new sections, pick kanji with thematic weight, not just aesthetic. Avoid mixing Chinese-only characters (the project uses Japanese readings/contexts).

**Torii gate** (`HybridHero.tsx:15`) — the central emblem is a procedural SVG torii (鳥居). It represents a threshold / gateway, appropriate for a studio "entrance". Keep its floating animation (`y: [0,-12,0]`, 6s) and the rune-ring rotation (40s linear).

**Studio name** — "AKATSUKI" (暁) = dawn. The brand voice is cinematic, serious, mythic — not kawaii/cute. Copy should feel like a film title card, not a fan site.

**Nav logo** — currently shows `才輝亜 SAIKIA` (Javed's name in katakana-adjacent kanji). This is intentional as a personal brand marker.

**Sakura aesthetics** — petal hue range is `hsl(330-350)` (deep pink, not pastel). The palette intentionally skews warm-cinematic rather than soft-shoujo.
