/**
 * MediaPipe Tasks-Vision HandLandmarker wrapper (latest web version).
 * Runs fully client-side. Detects:
 *   - pinch (thumb tip <-> index tip)  => confirm / "click"
 *   - 3 fingers up                     => global "next / home"
 *   - open palm (5) held               => global "toggle menu"
 *   - open-palm horizontal swipe       => scroll
 *
 * Landmark indices (MediaPipe hand model):
 *   4 thumb tip, 8 index tip, 12 middle tip, 16 ring tip, 20 pinky tip
 *   PIP joints: 6 index, 10 middle, 14 ring, 18 pinky; 2/3 thumb.
 */

import {
  GESTURE_COOLDOWN_MS,
  GESTURE_FRAME_SKIP_MOBILE,
  GESTURE_VIDEO_DESKTOP,
  GESTURE_VIDEO_MOBILE,
  PINCH_THRESHOLD,
  type GlobalGestureType,
} from "./types";
import { isMobileDevice } from "./device";

interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureHandlers {
  onHandPresence: (present: boolean) => void;
  /** Fires once on pinch-down (edge), not every frame. */
  onPinchStart: () => void;
  onPinchState: (pinching: boolean) => void;
  onGlobalGesture: (type: GlobalGestureType) => void;
}

let landmarker: unknown = null;
let stream: MediaStream | null = null;
let video: HTMLVideoElement | null = null;
let rafId = 0;
let running = false;

// gesture state trackers
let pinchWasDown = false;
let lastGestureAt = 0;
let palmStartX: number | null = null;
let palmHoldStart: number | null = null; // timestamp-based, not frame-count
let fistHoldStart: number | null = null; // for "home" gesture

const PALM_HOLD_MS = 800;  // open palm held this long => toggle menu
const FIST_HOLD_MS = 700;  // closed fist held this long => scroll home
const PALM_SWIPE_THRESHOLD = 0.18; // normalized dx; 0.18 is reachable without big arm swing

const dist = (a: Landmark, b: Landmark) =>
  Math.hypot(a.x - b.x, a.y - b.y);

/** How many of the 4 non-thumb fingers are extended (tip above PIP). */
function countExtendedFingers(lm: Landmark[]): number {
  const pairs = [
    [8, 6],
    [12, 10],
    [16, 14],
    [20, 18],
  ];
  let count = 0;
  for (const [tip, pip] of pairs) {
    if (lm[tip].y < lm[pip].y - 0.02) count++; // y grows downward
  }
  return count;
}

export async function startGesture(handlers: GestureHandlers): Promise<void> {
  if (running) return;

  const { HandLandmarker, FilesetResolver } = await import(
    "@mediapipe/tasks-vision"
  );

  // 20s hard timeout — CDN can be slow loading WASM + model (~33 MB total)
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Gesture engine timed out. Check your connection and retry.")), 20_000)
  );

  const fileset = await Promise.race([
    FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
    ),
    timeout,
  ]);

  const modelAssetPath =
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

  // Try GPU first; fall back to CPU if the delegate fails (some browsers/hardware)
  try {
    landmarker = await Promise.race([
      HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath, delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 1,
      }),
      timeout,
    ]);
  } catch {
    landmarker = await Promise.race([
      HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath, delegate: "CPU" },
        runningMode: "VIDEO",
        numHands: 1,
      }),
      timeout,
    ]);
  }

  const onMobile = isMobileDevice();
  const videoConstraints = onMobile ? GESTURE_VIDEO_MOBILE : GESTURE_VIDEO_DESKTOP;
  const frameSkip = onMobile ? GESTURE_FRAME_SKIP_MOBILE : 1;

  stream = await navigator.mediaDevices.getUserMedia({
    video: { ...videoConstraints, facingMode: "user" },
    audio: false,
  });

  video = document.createElement("video");
  video.autoplay = true;
  video.playsInline = true;
  video.muted = true;
  video.srcObject = stream;
  await video.play();

  running = true;
  pinchWasDown = false;
  palmStartX = null;
  palmHoldStart = null;
  fistHoldStart = null;

  let frameCount = 0;
  const loop = () => {
    if (!running || !video || !landmarker) return;
    frameCount++;
    if (frameCount % frameSkip !== 0) {
      rafId = requestAnimationFrame(loop);
      return;
    }
    const now = performance.now();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (landmarker as any).detectForVideo(video, now);
    const hands = result?.landmarks as Landmark[][] | undefined;

    if (hands && hands.length > 0) {
      const lm = hands[0];
      handlers.onHandPresence(true);

      // --- pinch (confirm) ---
      const pinchDist = dist(lm[4], lm[8]);
      const pinching = pinchDist < PINCH_THRESHOLD;
      handlers.onPinchState(pinching);
      if (pinching && !pinchWasDown) handlers.onPinchStart();
      pinchWasDown = pinching;

      // --- finger-count global gestures (debounced) ---
      const extended = countExtendedFingers(lm);
      const cool = now - lastGestureAt > GESTURE_COOLDOWN_MS;

      // 3 fingers = next section
      if (extended === 3 && cool) {
        handlers.onGlobalGesture("next");
        lastGestureAt = now;
        fistHoldStart = null;
        palmHoldStart = null;
        palmStartX = null;
      }
      // open palm (4 fingers): hold => toggle menu, swipe => next section
      else if (extended === 4) {
        if (palmHoldStart === null) palmHoldStart = now;
        fistHoldStart = null;

        const wristX = lm[0].x;
        if (palmStartX === null) palmStartX = wristX;
        const dx = wristX - palmStartX;

        if (Math.abs(dx) > PALM_SWIPE_THRESHOLD && cool) {
          handlers.onGlobalGesture("next");
          lastGestureAt = now;
          palmStartX = wristX;
          palmHoldStart = now; // reset hold timer after swipe
        } else if (now - palmHoldStart >= PALM_HOLD_MS && cool) {
          handlers.onGlobalGesture("toggle-menu");
          lastGestureAt = now;
          palmHoldStart = now; // reset so it doesn't re-fire immediately
        }
      }
      // closed fist (0 fingers): hold => scroll home
      else if (extended === 0) {
        if (fistHoldStart === null) fistHoldStart = now;
        palmHoldStart = null;
        palmStartX = null;

        if (now - fistHoldStart >= FIST_HOLD_MS && cool) {
          handlers.onGlobalGesture("home");
          lastGestureAt = now;
          fistHoldStart = now; // reset so it doesn't re-fire
        }
      }
      else {
        palmHoldStart = null;
        palmStartX = null;
        fistHoldStart = null;
      }
    } else {
      handlers.onHandPresence(false);
      handlers.onPinchState(false);
      pinchWasDown = false;
      palmHoldStart = null;
      palmStartX = null;
      fistHoldStart = null;
    }

    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
}

export function stopGesture(): void {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  if (video) {
    video.srcObject = null;
    video = null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  try {
    (landmarker as any)?.close?.();
  } catch {
    /* ignore */
  }
  landmarker = null;
}
