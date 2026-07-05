"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useHybridNav } from "./HybridNavProvider";

function Toggle({
  label,
  hint,
  on,
  busy,
  onClick,
  disabled,
}: {
  label: string;
  hint: string;
  on: boolean;
  busy?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className="group flex w-full items-center justify-between gap-4 rounded-xl border border-rose-300/15 bg-dusk-800/60 px-4 py-3 text-left transition-colors duration-200 hover:border-rose-glow/50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
    >
      <span>
        <span className="block font-body text-sm font-semibold text-haze">
          {label}
        </span>
        <span className="block font-body text-xs text-rose-200/60">{hint}</span>
      </span>
      <span
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${
          on ? "bg-rose-glow shadow-glow-rose" : "bg-dusk-600"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-haze transition-transform duration-200 ${
            on ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}

export function CameraSettingsPanel() {
  const [open, setOpen] = useState(false);
  const {
    supported,
    gazeEnabled,
    gestureEnabled,
    status,
    error,
    handPresent,
    pinching,
    enableGaze,
    disableGaze,
    enableGesture,
    disableGesture,
  } = useHybridNav();

  const busy = status === "loading";

  return (
    <div className="fixed bottom-5 right-5 z-[90]">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="mb-3 w-80 rounded-2xl border border-rose-300/20 bg-dusk-900/90 p-5 backdrop-blur-xl shadow-glow-soft"
          >
            <h3 className="font-display text-lg text-haze">Multimodal Controls</h3>
            <p className="mt-1 font-body text-xs text-rose-200/60">
              All processing stays on your device. Camera never leaves the browser.
            </p>

            {!supported && (
              <p className="mt-4 rounded-lg bg-ember-600/20 px-3 py-2 font-body text-xs text-ember-gold">
                Camera features need HTTPS (or localhost) and a webcam. Touch &amp;
                mouse still work everywhere.
              </p>
            )}

            <div className="mt-4 space-y-3">
              <Toggle
                label="Gaze pointing"
                hint="Look to highlight · dwell 1.8s to select"
                on={gazeEnabled}
                busy={busy}
                disabled={!supported}
                onClick={gazeEnabled ? disableGaze : enableGaze}
              />
              <Toggle
                label="Hand gestures"
                hint="Pinch = confirm · 3 fingers = next · fist = home · palm hold = menu"
                on={gestureEnabled}
                busy={busy}
                disabled={!supported}
                onClick={gestureEnabled ? disableGesture : enableGesture}
              />
            </div>

            {error && (
              <p className="mt-3 font-body text-xs text-ember-500">{error}</p>
            )}

            {gestureEnabled && (
              <div className="mt-4 flex items-center gap-3 font-body text-xs">
                <span
                  className={`inline-flex items-center gap-1.5 ${
                    handPresent ? "text-ember-gold" : "text-rose-200/40"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      handPresent ? "bg-ember-gold animate-pulse" : "bg-rose-200/30"
                    }`}
                  />
                  {handPresent ? "Hand detected" : "No hand"}
                </span>
                {pinching && (
                  <span className="text-rose-glow">● pinching</span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle camera navigation settings"
        className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-300/25 bg-dusk-800/80 backdrop-blur-md shadow-glow-rose transition-transform duration-200 hover:scale-105 cursor-pointer"
      >
        {/* eye / camera SVG icon */}
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          className={`${
            gazeEnabled || gestureEnabled ? "text-ember-gold" : "text-rose-300"
          }`}
        >
          <path
            d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      </button>
    </div>
  );
}
