"use client";

import { motion } from "framer-motion";
import { useHybridTarget } from "./useHybridTarget";

type Variant = "primary" | "ghost" | "nav";

const CIRC = 2 * Math.PI * 46; // dwell ring circumference (r=46)

/**
 * A button that participates in the hybrid nav system.
 * - Gaze: enlarges + neon glow when looked at.
 * - Dwell: animated ring fills; auto-activates at 100%.
 * - Gesture: pinch while gazed confirms.
 * - Touch/mouse: plain onClick — always works.
 */
export function HybridButton({
  id,
  onActivate,
  children,
  variant = "primary",
  className = "",
}: {
  id: string;
  onActivate: () => void;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  const { ref, isGazed, dwellProgress, pinching } =
    useHybridTarget<HTMLButtonElement>(id, onActivate);

  const base =
    "relative inline-flex items-center justify-center font-body font-semibold rounded-full transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ember-gold focus-visible:ring-offset-2 focus-visible:ring-offset-dusk-900";

  const variants: Record<Variant, string> = {
    primary:
      "px-8 py-4 text-base text-dusk-950 bg-gradient-to-r from-rose-300 via-rose-glow to-ember-400 shadow-glow-rose hover:shadow-glow-gold",
    ghost:
      "px-8 py-4 text-base text-haze border border-rose-300/40 bg-dusk-800/40 backdrop-blur-md hover:border-ember-gold/70 hover:text-ember-gold",
    nav: "px-4 py-2 text-sm text-rose-100/90 hover:text-ember-gold",
  };

  return (
    <motion.button
      ref={ref}
      onClick={onActivate}
      animate={{
        scale: isGazed ? (pinching ? 0.96 : 1.08) : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`${base} ${variants[variant]} ${
        isGazed ? "shadow-glow-gold z-10" : ""
      } ${className}`}
    >
      {children}

      {/* neon gaze halo */}
      {isGazed && (
        <span className="pointer-events-none absolute -inset-1 rounded-full ring-2 ring-ember-gold/70 animate-pulse-glow" />
      )}

      {/* dwell progress ring */}
      {isGazed && dwellProgress > 0 && (
        <svg
          className="pointer-events-none absolute -inset-3"
          viewBox="0 0 100 100"
          aria-hidden
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="rgba(255,207,139,0.9)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - dwellProgress)}
            transform="rotate(-90 50 50)"
          />
        </svg>
      )}
    </motion.button>
  );
}
