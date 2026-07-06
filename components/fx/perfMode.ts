"use client";

import { useEffect, useState } from "react";

const KEY = "akatsuki:perf-mode";
const EVENT = "perfmode:change";

function readStored(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function setPerfMode(on: boolean): void {
  window.localStorage.setItem(KEY, on ? "1" : "0");
  window.dispatchEvent(new CustomEvent<boolean>(EVENT, { detail: on }));
}

/** Shared on/off flag for low-power visuals (fewer petals, simpler draws). */
export function usePerfMode(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(readStored);

  useEffect(() => {
    setOn(readStored());
    const handler = (e: Event) => setOn((e as CustomEvent<boolean>).detail);
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  return [on, setPerfMode];
}
