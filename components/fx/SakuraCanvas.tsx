"use client";

import { useEffect, useRef } from "react";
import { usePerfMode } from "./perfMode";

interface Petal {
  x: number;
  y: number;
  size: number;
  speedY: number;
  drift: number;
  angle: number;
  spin: number;
  hue: number;
  alpha: number;
}

/**
 * Procedural falling sakura petals on a <canvas>. No image assets.
 * DPR-aware, pauses when the tab is hidden, and honors prefers-reduced-motion.
 */
export function SakuraCanvas({ density = 28 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [perfMode] = usePerfMode();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let w = 0;
    let h = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let petals: Petal[] = [];
    let raf = 0;
    let running = true;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const makePetal = (initial = false): Petal => ({
      x: rand(0, w),
      y: initial ? rand(0, h) : rand(-60, -10),
      size: rand(7, 16),
      speedY: rand(0.4, 1.3),
      drift: rand(-0.6, 0.6),
      angle: rand(0, Math.PI * 2),
      spin: rand(-0.02, 0.02),
      hue: rand(330, 350), // pink range
      alpha: rand(0.5, 0.95),
    });

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const base = perfMode ? Math.round(density / 2) : density;
      const count = reduced ? Math.round(base / 3) : base;
      petals = Array.from({ length: count }, () => makePetal(true));
    };

    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = p.alpha;
      // petal = two mirrored bezier lobes
      const s = p.size;
      if (perfMode) {
        // flat fill — skip the per-frame gradient + vein stroke on low power
        ctx.fillStyle = `hsla(${p.hue}, 88%, 76%, 1)`;
      } else {
        const grad = ctx.createLinearGradient(0, -s, 0, s);
        grad.addColorStop(0, `hsla(${p.hue}, 90%, 82%, 1)`);
        grad.addColorStop(1, `hsla(${p.hue - 8}, 85%, 68%, 1)`);
        ctx.fillStyle = grad;
      }
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.7, -s * 0.6, s * 0.6, s * 0.6, 0, s);
      ctx.bezierCurveTo(-s * 0.6, s * 0.6, -s * 0.7, -s * 0.6, 0, -s);
      ctx.fill();
      if (!perfMode) {
        // subtle vein
        ctx.strokeStyle = `hsla(${p.hue - 12}, 80%, 60%, 0.4)`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.8);
        ctx.lineTo(0, s * 0.8);
        ctx.stroke();
      }
      ctx.restore();
    };

    let t = 0;
    const frame = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      t += 0.01;
      for (const p of petals) {
        p.y += p.speedY;
        p.x += p.drift + Math.sin(t + p.y * 0.01) * 0.4;
        p.angle += p.spin;
        if (p.y > h + 30) Object.assign(p, makePetal(false));
        if (p.x < -40) p.x = w + 30;
        if (p.x > w + 40) p.x = -30;
        drawPetal(p);
      }
      raf = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      running = !document.hidden;
      if (running) {
        raf = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(raf);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    if (reduced) {
      // draw a single static field, no animation
      for (const p of petals) drawPetal(p);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [density, perfMode]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
