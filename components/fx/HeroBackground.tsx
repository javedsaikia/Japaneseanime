"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SakuraCanvas } from "./SakuraCanvas";

/**
 * Layered "Sakura Dawn" atmosphere with mouse/touch parallax.
 * Stack (bottom -> top):
 *   sky gradient (fallback) -> hero video -> readability overlay -> god-rays
 *   -> mist -> glow orbs -> sakura -> lens flare -> vignette -> film grain.
 *
 * The video fades in only once it can actually play, so there is never a
 * black flash; if it errors the gradient simply remains.
 */
export function HeroBackground({ videoSrc }: { videoSrc?: string }) {
  // pointer position (-0.5..0.5) drives parallax
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18 });
  const sy = useSpring(py, { stiffness: 60, damping: 18 });

  const raysX = useTransform(sx, [-0.5, 0.5], [20, -20]);
  const raysY = useTransform(sy, [-0.5, 0.5], [12, -12]);
  const orbsX = useTransform(sx, [-0.5, 0.5], [-34, 34]);
  const orbsY = useTransform(sy, [-0.5, 0.5], [-20, 20]);
  const flareX = useTransform(sx, [-0.5, 0.5], [-50, 50]);
  // video drifts slightly against the pointer for depth
  const vidX = useTransform(sx, [-0.5, 0.5], [10, -10]);
  const vidY = useTransform(sy, [-0.5, 0.5], [6, -6]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  // Skip only on provably slow connections — NOT screen width.
  // Mobile Safari must see the video; width-skipping broke it entirely.
  const [skipVideo] = useState(() => {
    if (typeof window === "undefined") return false;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    return conn?.saveData === true || conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g";
  });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py]);

  // Kick playback eagerly on mount — do NOT wait for onCanPlay.
  // iOS Safari ignores the `autoPlay` attribute and needs an explicit play()
  // call; without it onCanPlay never fires, videoReady stays false, opacity = 0.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();
      return;
    }
    v.muted = true; // set imperatively — React's muted prop is unreliable on Safari
    v.load();       // force Safari to start buffering (preload hint is ignored on cellular)
    v.play().catch(() => {
      /* vetoed by browser policy → gradient fallback remains, no crash */
    });
  }, []); // run once on mount, independent of videoReady

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* animated dawn sky — always present as base + fallback */}
      <div className="sky-gradient absolute inset-0 animate-gradient-drift" />

      {/* hero reel video */}
      {videoSrc && !videoFailed && !skipVideo && (
        <motion.div
          style={{ x: vidX, y: vidY }}
          className="absolute -inset-4"
          initial={false}
          animate={{ opacity: videoReady ? 1 : 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/hero-poster.jpg"
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
            className="h-full w-full object-cover"
          >
            {/* VP9 WebM first — ~40% smaller than H.264 */}
            <source src={videoSrc.replace(/\.mp4$/, ".webm")} type="video/webm" />
            <source src={videoSrc} type="video/mp4" />
          </video>
        </motion.div>
      )}

      {/* readability overlay: keeps headline/CTA contrast over bright frames */}
      <div className="absolute inset-0 bg-gradient-to-b from-dusk-950/70 via-dusk-900/25 to-dusk-950/80" />

      {/* god-ray beams */}
      <motion.div
        style={{ x: raysX, y: raysY }}
        className="god-rays absolute inset-0 animate-god-rays"
      />

      {/* drifting glow orbs */}
      <motion.div style={{ x: orbsX, y: orbsY }} className="absolute inset-0">
        <div className="absolute left-[12%] top-[22%] h-40 w-40 rounded-full bg-rose-glow/25 blur-3xl animate-float" />
        <div className="absolute right-[16%] top-[30%] h-56 w-56 rounded-full bg-ember-400/20 blur-3xl animate-float [animation-delay:1.5s]" />
        <div className="absolute left-[40%] bottom-[18%] h-48 w-48 rounded-full bg-ember-gold/20 blur-3xl animate-float [animation-delay:3s]" />
      </motion.div>

      {/* mist near the horizon */}
      <div className="mist absolute inset-0" />

      {/* sakura petals */}
      <SakuraCanvas />

      {/* lens flare bloom, top-right sun */}
      <motion.div
        style={{ x: flareX }}
        className="lens-flare absolute right-[18%] top-[16%] h-64 w-64 rounded-full animate-pulse-glow"
      />

      {/* cinematic finish */}
      <div className="vignette absolute inset-0" />
      <div className="film-grain absolute inset-0" />
    </div>
  );
}
