"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { HybridButton } from "../hybrid/HybridButton";

/* ---------------------------------------------------------------------- */
/* Shared bits                                                             */
/* ---------------------------------------------------------------------- */

const easeReveal = [0.22, 1, 0.36, 1] as const;

function SectionHeading({
  kicker,
  title,
  accent,
}: {
  kicker: string;
  title: string;
  accent: string;
}) {
  return (
    <div className="text-center">
      <motion.p
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.6, ease: easeReveal }}
        className="font-body text-xs uppercase tracking-[0.45em] text-ember-gold/80"
      >
        {kicker}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.8, delay: 0.08, ease: easeReveal }}
        className="mt-4 font-display text-3xl leading-tight text-haze drop-shadow-text-glow sm:text-4xl md:text-5xl lg:text-6xl"
      >
        {title}{" "}
        <span className="bg-gradient-to-r from-rose-300 via-rose-glow to-ember-gold bg-clip-text text-transparent">
          {accent}
        </span>
      </motion.h2>
    </div>
  );
}

/** Giant kanji that drifts slower than the scroll for depth. */
function ParallaxKanji({
  char,
  progress,
  className,
}: {
  char: string;
  progress: MotionValue<number>;
  className: string;
}) {
  const y = useTransform(progress, [0, 1], [120, -120]);
  return (
    <motion.span
      aria-hidden
      style={{ y }}
      className={`pointer-events-none absolute select-none font-display text-[16rem] leading-none text-rose-glow/[0.06] md:text-[24rem] ${className}`}
    >
      {char}
    </motion.span>
  );
}

/* ---------------------------------------------------------------------- */
/* 1. Originals — staggered show cards                                     */
/* ---------------------------------------------------------------------- */

const SHOWS = [
  {
    title: "Blade of the Dawn",
    tag: "Action · Fantasy",
    kanji: "刃",
    gradient: "from-rose-glow/70 via-dusk-700 to-dusk-900",
    image: "/blade.jpg",
  },
  {
    title: "Petals in Orbit",
    tag: "Sci-Fi · Romance",
    kanji: "宙",
    gradient: "from-ember-500/70 via-dusk-700 to-dusk-900",
    image: "/romance.jpg",
  },
  {
    title: "The Last Ronin's Song",
    tag: "Drama · Historical",
    kanji: "侍",
    gradient: "from-ember-gold/60 via-dusk-700 to-dusk-900",
    image: "/history1.jpg",
  },
];

function OriginalsSection() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return (
    <section
      id="originals"
      ref={ref}
      className="relative overflow-hidden bg-dusk-950 px-6 py-28 md:py-40"
    >
      <ParallaxKanji char="暁" progress={scrollYProgress} className="-left-10 top-8" />
      <SectionHeading kicker="Original Series" title="Worlds We" accent="Breathe Life Into" />

      <div className="mx-auto mt-16 flex max-w-6xl flex-col gap-14">
        {SHOWS.map((show, i) => (
          <motion.article
            key={show.title}
            initial={{ opacity: 0, y: 72 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.9, ease: easeReveal }}
            whileHover={{ scale: 1.01 }}
            className="group relative aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] cursor-pointer overflow-hidden rounded-[2rem] border border-rose-300/15 bg-dusk-900 shadow-glow-soft"
          >
            {/* cinematic key-art fills the whole banner */}
            {"image" in show && show.image ? (
              <img
                src={show.image}
                alt={`${show.title} key art`}
                className="absolute inset-0 h-full w-full object-cover brightness-105 saturate-110 transition-transform duration-[900ms] ease-out group-hover:scale-105"
              />
            ) : (
              <div
                className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${show.gradient}`}
              >
                <span className="font-display text-[10rem] text-haze/90 drop-shadow-text-glow transition-transform duration-500 group-hover:scale-110">
                  {show.kanji}
                </span>
              </div>
            )}

            {/* atmosphere + legibility — just enough bottom fade for the title, image stays bright */}
            <div className="film-grain absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-dusk-950/95 from-0% via-dusk-950/15 via-35% to-transparent to-60%" />

            {/* overlaid title, like the hero */}
            <div className="absolute inset-x-0 bottom-0 p-8 md:p-12">
              <p className="font-body text-xs uppercase tracking-[0.3em] text-ember-gold/90 md:text-sm">
                {show.tag}
              </p>
              <h3 className="mt-3 font-display text-3xl text-haze drop-shadow-text-glow transition-colors duration-200 group-hover:text-rose-300 md:text-5xl">
                {show.title}
              </h3>
            </div>

            {/* hover glow ring */}
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-0 shadow-glow-rose transition-opacity duration-300 group-hover:opacity-100" />
          </motion.article>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/* 2. Studio — craft statement + stats with parallax band                  */
/* ---------------------------------------------------------------------- */

const STATS = [
  { value: "120+", label: "Episodes Produced" },
  { value: "14", label: "International Awards" },
  { value: "9", label: "Original Universes" },
  { value: "60fps", label: "Sakuga Standard" },
];

function StudioSection() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  const bandY = useTransform(smooth, [0, 1], [80, -80]);
  const glowX = useTransform(smooth, [0, 1], ["-20%", "20%"]);

  return (
    <section
      id="studio"
      ref={ref}
      className="relative overflow-hidden bg-dusk-900 px-6 py-28 md:py-40"
    >
      {/* drifting glow band */}
      <motion.div
        style={{ x: glowX }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-glow/10 blur-3xl"
      />
      <ParallaxKanji char="魂" progress={scrollYProgress} className="-right-14 bottom-0" />

      <SectionHeading kicker="The Studio" title="Every Frame," accent="Hand-Poured Soul" />

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, delay: 0.15, ease: easeReveal }}
        className="mx-auto mt-6 max-w-2xl text-center font-body text-rose-100/70 md:text-lg"
      >
        From key animation to final grade, everything happens under one roof in
        Tokyo — where veteran sakuga artists and new-generation directors chase
        the same sunrise.
      </motion.p>

      <motion.div
        style={{ y: bandY }}
        className="mx-auto mt-20 grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4"
      >
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: easeReveal }}
            className="rounded-2xl border border-rose-300/15 bg-dusk-800/60 p-6 text-center backdrop-blur-sm"
          >
            <p className="font-display text-3xl text-ember-gold drop-shadow-gold-glow md:text-4xl">
              {s.value}
            </p>
            <p className="mt-2 font-body text-xs uppercase tracking-widest text-rose-100/60">
              {s.label}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* ---------------------------------------------------------------------- */
/* 3. Finale — CTA (hybrid target) + footer                                */
/* ---------------------------------------------------------------------- */

function FinaleSection() {
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });
  const sunScale = useTransform(scrollYProgress, [0, 1], [0.6, 1.15]);
  const sunOpacity = useTransform(scrollYProgress, [0, 0.7], [0.15, 0.5]);

  return (
    <section
      id="finale"
      ref={ref}
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-dusk-950 px-6 py-28 text-center"
    >
      {/* rising sun glow */}
      <motion.div
        style={{ scale: sunScale, opacity: sunOpacity }}
        className="pointer-events-none absolute bottom-[-30%] left-1/2 h-[70vh] w-[70vh] -translate-x-1/2 rounded-full bg-gradient-to-t from-ember-500 via-rose-glow to-transparent blur-2xl"
      />

      <SectionHeading kicker="Join the Journey" title="The Next Chapter" accent="Awaits You" />

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, delay: 0.1, ease: easeReveal }}
        className="mt-6 max-w-lg font-body text-rose-100/70"
      >
        Show three fingers, pinch a button, or just tap — the studio unfolds
        however you move.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, delay: 0.22, ease: easeReveal }}
        className="relative z-10 mt-10 flex flex-col items-center gap-4 sm:flex-row"
      >
        <HybridButton
          id="finale-top"
          onActivate={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          ↑ Back to the Dawn
        </HybridButton>
        <HybridButton
          id="finale-contact"
          variant="ghost"
          onActivate={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          Work With Us
        </HybridButton>
      </motion.div>

      <footer className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] inset-x-0 px-6">
        <p className="font-body text-xs text-rose-100/40">
          © 2026 AKATSUKI STUDIO — Tokyo · All processing stays on your device.
        </p>
      </footer>
    </section>
  );
}

/* ---------------------------------------------------------------------- */

export function ScrollSections() {
  return (
    <>
      <OriginalsSection />
      <StudioSection />
      <FinaleSection />
    </>
  );
}
