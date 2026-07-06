"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { HeroBackground } from "./fx/HeroBackground";
import { HybridButton } from "./hybrid/HybridButton";
import { CalibrationOverlay } from "./hybrid/CalibrationOverlay";
import { CameraSettingsPanel } from "./hybrid/CameraSettingsPanel";
import { GestureToast } from "./hybrid/GestureToast";
import { useHybridNav } from "./hybrid/HybridNavProvider";

const NAV = ["Originals", "Studio", "Talent", "Watch"];

const NAV_TARGETS: Record<string, string> = {
  Originals: "originals",
  Studio: "studio",
  Talent: "finale",
  Watch: "originals",
};

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/** Central glowing torii + rune-circle emblem (procedural SVG). */
function ToriiEmblem() {
  return (
    <motion.div
      className="relative mx-auto h-52 w-52 md:h-64 md:w-64"
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* rotating rune ring */}
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full drop-shadow-gold-glow"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="100"
          cy="100"
          r="88"
          fill="none"
          stroke="rgba(255,207,139,0.5)"
          strokeWidth="1"
          strokeDasharray="2 8"
        />
        <circle
          cx="100"
          cy="100"
          r="74"
          fill="none"
          stroke="rgba(255,95,162,0.5)"
          strokeWidth="1.5"
          strokeDasharray="14 10"
        />
      </motion.svg>

      {/* torii gate */}
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full drop-shadow-text-glow"
      >
        <g
          stroke="url(#torii)"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M45 70 Q100 56 155 70" />
          <path d="M52 88 L148 88" />
          <path d="M66 70 L66 150" />
          <path d="M134 70 L134 150" />
        </g>
        <defs>
          <linearGradient id="torii" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffd6e6" />
            <stop offset="0.5" stopColor="#ff5fa2" />
            <stop offset="1" stopColor="#ffcf8b" />
          </linearGradient>
        </defs>
      </svg>

      {/* core glow */}
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember-gold/30 blur-2xl animate-pulse-glow" />
    </motion.div>
  );
}

export function HybridHero() {
  const { enableGaze, gazeEnabled, gestureEnabled, supported } = useHybridNav();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInvite, setShowInvite] = useState(true);

  // Scroll-linked exit: as the hero scrolls away, content drifts up, fades,
  // and the whole backdrop gently zooms for a cinematic hand-off.
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const bgOpacity = useTransform(scrollYProgress, [0.5, 1], [1, 0.35]);

  // React to global (anywhere-on-screen) gestures broadcast by the provider.
  useEffect(() => {
    const next = () =>
      window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
    const home = () => window.scrollTo({ top: 0, behavior: "smooth" });
    const toggle = () => setMenuOpen((o) => !o);
    window.addEventListener("hybridnav:next", next);
    window.addEventListener("hybridnav:home", home);
    window.addEventListener("hybridnav:toggle-menu", toggle);
    return () => {
      window.removeEventListener("hybridnav:next", next);
      window.removeEventListener("hybridnav:home", home);
      window.removeEventListener("hybridnav:toggle-menu", toggle);
    };
  }, []);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.14, delayChildren: 0.2 } },
  };
  const item = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
  };

  return (
    <section
      ref={sectionRef}
      className="relative h-[100dvh] w-full overflow-hidden"
    >
      <motion.div
        style={{ scale: bgScale, opacity: bgOpacity }}
        className="absolute inset-0"
      >
        <HeroBackground videoSrc="/hero-reel.mp4" />
      </motion.div>

      {/* ---- Top nav ---- */}
      <nav className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 md:px-12">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="group flex flex-col items-start leading-none cursor-pointer"
        >
          <span className="font-display text-2xl tracking-wide bg-gradient-to-b from-ember-gold via-ember-400 to-ember-600 bg-clip-text text-transparent drop-shadow-gold-glow transition-transform duration-300 group-hover:scale-105">
            才輝亜雷安
          </span>
          <span className="mt-1 font-body text-[10px] font-semibold uppercase tracking-[0.4em] text-ember-gold/80">
            Saikia Rayyan
          </span>
        </button>

        <div className="hidden items-center gap-2 md:flex">
          {NAV.map((label) => (
            <HybridButton
              key={label}
              id={`nav-${label}`}
              variant="nav"
              onActivate={() => scrollTo(NAV_TARGETS[label])}
            >
              {label}
            </HybridButton>
          ))}
          <HybridButton
            id="nav-cta"
            variant="ghost"
            onActivate={() => scrollTo("originals")}
            className="!px-6 !py-2 !text-sm"
          >
            Enter
          </HybridButton>
        </div>

        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          className="md:hidden text-haze cursor-pointer"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d={menuOpen ? "M6 6l12 12M6 18L18 6" : "M4 7h16M4 12h16M4 17h16"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </nav>

      {/* mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-x-0 top-16 z-30 mx-4 rounded-2xl border border-rose-300/20 bg-dusk-900/90 p-4 backdrop-blur-xl md:hidden"
        >
          {NAV.map((label) => (
            <button
              key={label}
              onClick={() => {
                setMenuOpen(false);
                scrollTo(NAV_TARGETS[label]);
              }}
              className="block w-full rounded-lg px-4 py-3 text-left font-body text-rose-100 hover:bg-dusk-800 cursor-pointer"
            >
              {label}
            </button>
          ))}
        </motion.div>
      )}

      {/* ---- Center content ---- */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-20 flex h-full flex-col items-center justify-center px-6 text-center"
      >
        <motion.div variants={item}>
          <ToriiEmblem />
        </motion.div>

        <motion.p
          variants={item}
          className="mt-6 font-body text-sm uppercase tracking-[0.4em] text-ember-gold/90"
        >
          A Modern Animation Studio
        </motion.p>

        <motion.h1
          variants={item}
          className="mt-4 font-display text-5xl leading-[0.95] text-haze drop-shadow-text-glow sm:text-6xl md:text-8xl"
        >
          WHERE LEGENDS
          <br />
          <span className="bg-gradient-to-r from-rose-300 via-rose-glow to-ember-gold bg-clip-text text-transparent">
            ARE DRAWN
          </span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-6 max-w-xl font-body text-base text-rose-100/80 md:text-lg"
        >
          Cinematic worlds. Unforgettable heroes. Experience our universe
          hands-free — with your gaze, a gesture, or a touch.
        </motion.p>

        <motion.div
          variants={item}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <HybridButton
            id="cta-watch"
            onActivate={() => scrollTo("originals")}
          >
            ▶ Watch the Reel
          </HybridButton>
          <HybridButton
            id="cta-explore"
            variant="ghost"
            onActivate={() => scrollTo("originals")}
          >
            Explore Originals
          </HybridButton>
        </motion.div>

        {/* first-load immersive invite (privacy-friendly, opt-in) */}
        {showInvite && supported && !gazeEnabled && !gestureEnabled && (
          <motion.div
            variants={item}
            className="mt-8 flex items-center gap-3 rounded-full border border-ember-gold/30 bg-dusk-900/50 px-4 py-2 backdrop-blur-md"
          >
            <span className="font-body text-xs text-rose-100/80">
              ✧ Try hands-free navigation
            </span>
            <button
              onClick={() => {
                setShowInvite(false);
                enableGaze();
              }}
              className="rounded-full bg-ember-gold/90 px-3 py-1 font-body text-xs font-semibold text-dusk-950 hover:bg-ember-gold cursor-pointer"
            >
              Calibrate gaze
            </button>
            <button
              onClick={() => setShowInvite(false)}
              aria-label="Dismiss"
              className="text-rose-100/50 hover:text-rose-100 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* scroll cue */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-rose-100/60"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 4v16m0 0l6-6m-6 6l-6-6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      {/* hybrid nav UI overlays */}
      <CalibrationOverlay />
      <CameraSettingsPanel />
      <GestureToast />
    </section>
  );
}
