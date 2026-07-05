"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CALIBRATION_POINTS,
  DWELL_MS,
  type GazePoint,
  type GlobalGestureType,
  type HybridNavContextValue,
  type HybridStatus,
  type HybridTarget,
} from "./types";
import {
  friendlyCameraError,
  isSecureCameraContext,
  probeCameraAccess,
  startGaze,
  stopGaze,
} from "./gazeEngine";
import { startGesture, stopGesture } from "./gestureEngine";

const HybridNavContext = createContext<HybridNavContextValue | null>(null);

/** Broadcast a global gesture so decoupled listeners (the hero) can react. */
function broadcast(type: GlobalGestureType) {
  window.dispatchEvent(new CustomEvent(`hybridnav:${type}`));
}

export function HybridNavProvider({ children }: { children: React.ReactNode }) {
  const [supported, setSupported] = useState(false);
  const [gazeEnabled, setGazeEnabled] = useState(false);
  const [gestureEnabled, setGestureEnabled] = useState(false);
  const [status, setStatus] = useState<HybridStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [gaze, setGaze] = useState<GazePoint | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0);
  const [pinching, setPinching] = useState(false);
  const [handPresent, setHandPresent] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [calibrationClicks, setCalibrationClicks] = useState(0);

  const targets = useRef<Map<string, HybridTarget>>(new Map());
  const gazeRef = useRef<GazePoint | null>(null);
  const dotRef = useRef<HTMLDivElement | null>(null);
  const hitLoop = useRef<number>(0);
  // dwell bookkeeping
  const dwellTargetId = useRef<string | null>(null);
  const dwellStart = useRef<number>(0);
  const statusRef = useRef<HybridStatus>("idle");
  statusRef.current = status;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSupported(isSecureCameraContext());
  }, []);

  const flashToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1100);
  }, []);

  const registerTarget = useCallback((t: HybridTarget) => {
    targets.current.set(t.id, t);
  }, []);
  const unregisterTarget = useCallback((id: string) => {
    targets.current.delete(id);
    if (dwellTargetId.current === id) dwellTargetId.current = null;
  }, []);

  const activate = useCallback((id: string) => {
    const t = targets.current.get(id);
    if (t) t.onActivate();
  }, []);

  // ---- gaze hit-test + dwell loop (runs while gaze is on) ----
  const runHitLoop = useCallback(() => {
    const point = gazeRef.current;
    if (dotRef.current && point) {
      dotRef.current.style.left = `${point.x}px`;
      dotRef.current.style.top = `${point.y}px`;
    }

    let found: string | null = null;
    if (point) {
      const pad = 18; // forgiving hit radius around each target
      for (const t of targets.current.values()) {
        const r = t.el.getBoundingClientRect();
        if (
          point.x >= r.left - pad &&
          point.x <= r.right + pad &&
          point.y >= r.top - pad &&
          point.y <= r.bottom + pad
        ) {
          found = t.id;
          break;
        }
      }
    }

    setHoveredId((prev) => (prev === found ? prev : found));

    // dwell = fallback confirm, only once calibrated/ready
    const canActivate = statusRef.current === "ready";
    if (found && canActivate) {
      if (dwellTargetId.current !== found) {
        dwellTargetId.current = found;
        dwellStart.current = performance.now();
      }
      const elapsed = performance.now() - dwellStart.current;
      const p = Math.min(elapsed / DWELL_MS, 1);
      setDwellProgress(p);
      if (p >= 1) {
        activate(found);
        flashToast("Selected");
        dwellTargetId.current = null;
        dwellStart.current = 0;
        setDwellProgress(0);
      }
    } else {
      dwellTargetId.current = null;
      if (dwellProgress !== 0) setDwellProgress(0);
    }

    hitLoop.current = requestAnimationFrame(runHitLoop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activate, flashToast]);

  // ---- enable / disable gaze ----
  const enableGaze = useCallback(async () => {
    if (!isSecureCameraContext()) {
      setError("Camera unavailable — needs HTTPS or localhost + a webcam.");
      setStatus("error");
      return;
    }
    try {
      setError(null);
      setStatus("loading");
      // Surface permission problems clearly before WebGazer boots.
      await probeCameraAccess();
      await startGaze((p) => {
        gazeRef.current = p;
        setGaze(p);
      });
      setGazeEnabled(true);
      setCalibrationClicks(0);
      setStatus("calibrating");
      cancelAnimationFrame(hitLoop.current);
      hitLoop.current = requestAnimationFrame(runHitLoop);
    } catch (e) {
      setError(friendlyCameraError(e));
      setStatus("error");
    }
  }, [runHitLoop]);

  const disableGaze = useCallback(() => {
    stopGaze();
    cancelAnimationFrame(hitLoop.current);
    setGazeEnabled(false);
    setGaze(null);
    gazeRef.current = null;
    setHoveredId(null);
    setDwellProgress(0);
    if (!gestureEnabled) setStatus("idle");
  }, [gestureEnabled]);

  // ---- enable / disable gesture ----
  const enableGesture = useCallback(async () => {
    if (!isSecureCameraContext()) {
      setError("Camera unavailable — needs HTTPS or localhost + a webcam.");
      setStatus("error");
      return;
    }
    try {
      setError(null);
      setStatus("loading");
      await startGesture({
        onHandPresence: setHandPresent,
        onPinchState: setPinching,
        onPinchStart: () => {
          // pinch = primary confirm; activate whatever gaze is on,
          // else fall back to the element under the gaze/last point.
          const id = hoveredIdRef.current;
          if (id) {
            activate(id);
            flashToast("Confirmed");
          }
        },
        onGlobalGesture: (type) => {
          broadcast(type);
          flashToast(
            type === "home"
              ? "Home"
              : type === "next"
              ? "Next section"
              : "Menu"
          );
        },
      });
      setGestureEnabled(true);
      setStatus((s) => (s === "calibrating" ? s : "ready"));
    } catch (e) {
      setError(friendlyCameraError(e));
      setStatus("error");
    }
  }, [activate, flashToast]);

  const disableGesture = useCallback(() => {
    stopGesture();
    setGestureEnabled(false);
    setPinching(false);
    setHandPresent(false);
    if (!gazeEnabled) setStatus("idle");
  }, [gazeEnabled]);

  // keep a ref of hoveredId so the pinch callback (created once) sees latest
  const hoveredIdRef = useRef<string | null>(null);
  hoveredIdRef.current = hoveredId;

  const recordCalibrationClick = useCallback(() => {
    setCalibrationClicks((c) => {
      const next = c + 1;
      if (next >= CALIBRATION_POINTS) {
        setStatus("ready");
      }
      return next;
    });
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopGaze();
      stopGesture();
      cancelAnimationFrame(hitLoop.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const value = useMemo<HybridNavContextValue>(
    () => ({
      supported,
      gazeEnabled,
      gestureEnabled,
      status,
      error,
      gaze,
      hoveredId,
      dwellProgress,
      pinching,
      handPresent,
      toast,
      calibrationClicks,
      registerTarget,
      unregisterTarget,
      enableGaze,
      disableGaze,
      enableGesture,
      disableGesture,
      recordCalibrationClick,
    }),
    [
      supported,
      gazeEnabled,
      gestureEnabled,
      status,
      error,
      gaze,
      hoveredId,
      dwellProgress,
      pinching,
      handPresent,
      toast,
      calibrationClicks,
      registerTarget,
      unregisterTarget,
      enableGaze,
      disableGaze,
      enableGesture,
      disableGesture,
      recordCalibrationClick,
    ]
  );

  return (
    <HybridNavContext.Provider value={value}>
      {children}
      {gazeEnabled && <div ref={dotRef} className="gaze-dot" aria-hidden />}
    </HybridNavContext.Provider>
  );
}

export function useHybridNav(): HybridNavContextValue {
  const ctx = useContext(HybridNavContext);
  if (!ctx)
    throw new Error("useHybridNav must be used within <HybridNavProvider>");
  return ctx;
}
