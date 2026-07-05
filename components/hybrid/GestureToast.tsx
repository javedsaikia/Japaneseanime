"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useHybridNav } from "./HybridNavProvider";

/** Transient center-top feedback for global gestures / confirms. */
export function GestureToast() {
  const { toast } = useHybridNav();
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.9 }}
          className="fixed left-1/2 top-8 z-[95] -translate-x-1/2 rounded-full border border-ember-gold/40 bg-dusk-900/80 px-6 py-2 font-display text-ember-gold shadow-glow-gold backdrop-blur-md"
        >
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
