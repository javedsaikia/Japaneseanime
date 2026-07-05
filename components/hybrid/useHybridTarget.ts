"use client";

import { useEffect, useRef } from "react";
import { useHybridNav } from "./HybridNavProvider";

/**
 * Register a DOM element as a gaze/gesture target.
 * Returns a ref to attach + live feedback flags for styling.
 *
 * Touch/mouse still works natively — always wire the same handler to onClick.
 */
export function useHybridTarget<T extends HTMLElement>(
  id: string,
  onActivate: () => void
) {
  const { registerTarget, unregisterTarget, hoveredId, dwellProgress, pinching } =
    useHybridNav();
  const ref = useRef<T | null>(null);
  const cb = useRef(onActivate);
  cb.current = onActivate;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerTarget({ id, el, onActivate: () => cb.current() });
    return () => unregisterTarget(id);
  }, [id, registerTarget, unregisterTarget]);

  const isGazed = hoveredId === id;
  return {
    ref,
    isGazed,
    pinching: isGazed && pinching,
    dwellProgress: isGazed ? dwellProgress : 0,
  };
}
