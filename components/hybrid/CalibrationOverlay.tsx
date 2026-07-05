"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useHybridNav } from "./HybridNavProvider";
import { CALIBRATION_POINTS } from "./types";

// 9-point grid (percentages). Clicking each feeds WebGazer a sample.
const POINTS = [
  [15, 15],
  [50, 15],
  [85, 15],
  [15, 50],
  [50, 50],
  [85, 50],
  [15, 85],
  [50, 85],
  [85, 85],
];

export function CalibrationOverlay() {
  const { status, calibrationClicks, recordCalibrationClick } = useHybridNav();
  const active = status === "calibrating";

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[100] bg-dusk-950/85 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-x-0 top-10 text-center px-6">
            <h2 className="font-display text-2xl md:text-4xl text-haze drop-shadow-text-glow">
              Calibrate Your Gaze
            </h2>
            <p className="mt-3 font-body text-rose-200/80 text-sm md:text-base">
              Look at each glowing point and click it. Keep your head steady.
            </p>
            <p className="mt-2 font-display text-ember-gold text-lg">
              {calibrationClicks} / {CALIBRATION_POINTS}
            </p>
          </div>

          {POINTS.map(([x, y], i) => {
            const done = i < calibrationClicks;
            return (
              <button
                key={i}
                onClick={recordCalibrationClick}
                aria-label={`Calibration point ${i + 1}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <span
                  className={`block h-7 w-7 rounded-full border-2 transition-all duration-200 ${
                    done
                      ? "border-ember-gold bg-ember-gold/40 shadow-glow-gold scale-90"
                      : "border-rose-glow bg-rose-glow/25 shadow-glow-rose animate-pulse-glow hover:scale-125"
                  }`}
                />
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
