/**
 * Thin wrapper around WebGazer.js. Loaded dynamically (client-only) so it
 * never touches the server bundle. WebGazer self-calibrates from user clicks,
 * so the calibration overlay just needs the user to click the 9 dots.
 */

import { GAZE_SMOOTHING, type GazePoint } from "./types";

type WebGazerInstance = {
  setRegression: (name: string) => WebGazerInstance;
  setGazeListener: (
    cb: (data: { x: number; y: number } | null, ts: number) => void
  ) => WebGazerInstance;
  begin: () => Promise<WebGazerInstance>;
  end: () => void;
  showVideoPreview: (b: boolean) => WebGazerInstance;
  showPredictionPoints: (b: boolean) => WebGazerInstance;
  showFaceOverlay: (b: boolean) => WebGazerInstance;
  showFaceFeedbackBox: (b: boolean) => WebGazerInstance;
  saveDataAcrossSessions: (b: boolean) => WebGazerInstance;
  clearGazeListener: () => void;
};

let webgazer: WebGazerInstance | null = null;
let running = false;
// Exponential-moving-average smoothing to tame WebGazer's jitter.
let smooth: GazePoint | null = null;

export function isSecureCameraContext(): boolean {
  if (typeof window === "undefined") return false;
  const okProtocol =
    window.isSecureContext || location.hostname === "localhost";
  return Boolean(navigator.mediaDevices?.getUserMedia) && okProtocol;
}

/** Translate raw getUserMedia/DOMException failures into actionable copy. */
export function friendlyCameraError(e: unknown): string {
  const name = e instanceof DOMException ? e.name : "";
  const msg = e instanceof Error ? e.message : String(e);
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || /denied|permission/i.test(msg)) {
    return "Camera access denied. Click the camera icon in your browser's address bar, choose Allow, then toggle this back on.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No webcam found. Plug in a camera or use touch navigation.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Webcam is busy in another app or tab. Close it there and retry.";
  }
  if (name === "SecurityError") {
    return "Camera blocked by browser security. Use HTTPS or localhost.";
  }
  return msg || "Camera failed to start.";
}

/**
 * Request the camera once up-front so permission errors surface as a clear
 * DOMException here (WebGazer swallows them into vague failures otherwise).
 * The probe track is stopped immediately — WebGazer opens its own stream.
 */
export async function probeCameraAccess(): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  stream.getTracks().forEach((t) => t.stop());
}

export async function startGaze(
  onGaze: (p: GazePoint) => void
): Promise<void> {
  if (running) return;
  // webgazer ships as a browser global module; import the default export.
  const mod = await import("webgazer");
  webgazer = (mod.default ?? mod) as unknown as WebGazerInstance;

  smooth = null;
  webgazer
    .setRegression("ridge")
    .saveDataAcrossSessions(false) // stale calibration from different window size causes wrong gaze immediately
    .setGazeListener((data) => {
      if (!data) return;
      const alpha = GAZE_SMOOTHING;
      if (!smooth) smooth = { x: data.x, y: data.y };
      else {
        smooth = {
          x: smooth.x + alpha * (data.x - smooth.x),
          y: smooth.y + alpha * (data.y - smooth.y),
        };
      }
      onGaze(smooth);
    });

  await webgazer.begin();
  // We render our own gaze dot + keep the video hidden for a clean hero.
  webgazer
    .showVideoPreview(false)
    .showPredictionPoints(false)
    .showFaceOverlay(false)
    .showFaceFeedbackBox(false);
  running = true;
}

export function stopGaze(): void {
  if (!webgazer || !running) return;
  try {
    webgazer.clearGazeListener();
    webgazer.end();
  } catch {
    /* webgazer.end can throw if the video already went away — ignore */
  }
  running = false;
  smooth = null;
}
