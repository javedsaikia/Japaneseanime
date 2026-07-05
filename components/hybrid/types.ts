/** Shared types + tunables for the hybrid (gaze + gesture + touch) nav system. */

export type HybridStatus =
  | "idle" // nothing running
  | "loading" // libs / camera spinning up
  | "calibrating" // gaze calibration in progress
  | "ready" // at least one camera modality live
  | "error";

export interface GazePoint {
  x: number;
  y: number;
}

export interface HybridTarget {
  id: string;
  el: HTMLElement;
  /** Fired on confirm (pinch, dwell, or a real click/tap). */
  onActivate: () => void;
}

/** Global (anywhere-on-screen) gesture events, broadcast on `window`. */
export type GlobalGestureType = "home" | "next" | "toggle-menu";

export interface HybridNavState {
  /** getUserMedia + secure context available at all. */
  supported: boolean;
  gazeEnabled: boolean;
  gestureEnabled: boolean;
  status: HybridStatus;
  error: string | null;
  /** Latest smoothed gaze point in viewport px (null when gaze off). */
  gaze: GazePoint | null;
  /** Target currently under the gaze point. */
  hoveredId: string | null;
  /** 0..1 dwell fill for the hovered target. */
  dwellProgress: number;
  /** Live pinch state from MediaPipe. */
  pinching: boolean;
  handPresent: boolean;
  /** Transient on-screen feedback label, e.g. "Home". */
  toast: string | null;
}

export interface HybridNavContextValue extends HybridNavState {
  registerTarget: (t: HybridTarget) => void;
  unregisterTarget: (id: string) => void;
  enableGaze: () => Promise<void>;
  disableGaze: () => void;
  enableGesture: () => Promise<void>;
  disableGesture: () => void;
  /** Advance the click-to-calibrate flow; resolves when 9 points collected. */
  recordCalibrationClick: () => void;
  calibrationClicks: number;
}

// ---- Tunables ----
export const DWELL_MS = 1800; // gaze-hold fallback confirm
export const PINCH_THRESHOLD = 0.055; // normalized thumb<->index distance
export const GAZE_SMOOTHING = 0.35; // EMA alpha (higher = snappier)
export const GESTURE_COOLDOWN_MS = 1100; // debounce for global gestures
export const CALIBRATION_POINTS = 9;
