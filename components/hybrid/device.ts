/** Coarse-pointer / touch UA check — gaze tracking (WebGazer) is desktop-only. */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const uaMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  return uaMobile || coarsePointer;
}
