"use client";

/**
 * PixelMascot — renders Veasna the firefly onto a <canvas> with the raw 2D
 * context. No sprite sheets, no animation library: every frame is painted from
 * the character grid in lib/mascot/sprite.ts.
 *
 * Instances are STILL by default. The mascot appears on nearly every screen,
 * and a page full of independently bobbing sprites is noise rather than
 * personality — so motion is opt-in via `animated`, reserved for the few
 * places where it carries meaning (the assistant is thinking, work is
 * loading, the firefly has moved to a new station).
 */

import { useEffect, useRef } from "react";
import {
  EMISSIVE_KEYS,
  FRAMES,
  PALETTE,
  SPRITE_H,
  SPRITE_W,
  WING_KEYS,
  type PoseName,
} from "@/lib/mascot/sprite";

/** Canvas pixels per sprite pixel. Fixed, so the art never lands off-grid. */
const PX = 10;
const CANVAS_W = SPRITE_W * PX;
const CANVAS_H = SPRITE_H * PX;
const SPRITE_CENTRE_X = SPRITE_W / 2;
const BLOOM_COLOUR = "#ffd457";

/** Poses where an idle blink reads as natural. */
const BLINKING_POSES = new Set<PoseName>(["idle", "talking", "happy", "working", "thinking"]);

/* ------------------------------------------------------------------ *
 * Painting — pure, given a grid and a set of motion values.
 * ------------------------------------------------------------------ */

interface PaintOptions {
  /** Vertical offset in whole sprite pixels. */
  bobPx: number;
  /** 1 = wings out, <1 = squashed toward the body centre. */
  wingSpread: number;
  /** Lantern bloom strength, 0 disables it. */
  glow: number;
}

/** How a still mascot is drawn: no offset, wings out, steady lantern. */
const STILL: PaintOptions = { bobPx: 0, wingSpread: 1, glow: 0.8 };

function drawBloom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number
) {
  const cx = (x + 0.5) * PX;
  const cy = (y + 0.5) * PX;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, BLOOM_COLOUR);
  gradient.addColorStop(1, "transparent");

  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.globalAlpha = 1;
}

function paint(ctx: CanvasRenderingContext2D, grid: string[], opts: PaintOptions) {
  const { bobPx, wingSpread, glow } = opts;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Bloom pass, behind the sprite. Blooms stack additively and the lantern
  // glass alone is eight pixels, so each contribution has to stay faint or the
  // whole sprite washes out at larger sizes.
  if (glow > 0) {
    for (let y = 0; y < SPRITE_H; y++) {
      for (let x = 0; x < SPRITE_W; x++) {
        const key = grid[y][x];
        if (!EMISSIVE_KEYS.has(key)) continue;
        const isFlame = key === "L";
        drawBloom(ctx, x, y + bobPx, isFlame ? PX * 3.6 : PX * 1.8, (isFlame ? 0.34 : 0.13) * glow);
      }
    }
  }

  // Sprite pass.
  for (let y = 0; y < SPRITE_H; y++) {
    const row = grid[y];
    for (let x = 0; x < SPRITE_W; x++) {
      const key = row[x];
      const colour = PALETTE[key];
      if (!colour) continue;

      // Wings squash toward the body centre, then re-snap to the grid — any
      // sub-pixel drift would blur the nearest-neighbour scaling that makes
      // this read as pixel art.
      const drawX =
        wingSpread !== 1 && WING_KEYS.has(key)
          ? Math.round(SPRITE_CENTRE_X + (x - SPRITE_CENTRE_X) * wingSpread)
          : x;

      ctx.fillStyle = colour;
      ctx.fillRect(drawX * PX, (y + bobPx) * PX, PX, PX);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

export interface PixelMascotProps {
  pose?: PoseName;
  /** Rendered CSS size in px (square). */
  size?: number;
  /** Opt in to bobbing, wing-flap, a pulsing lantern and idle blinking. */
  animated?: boolean;
  /** Speed multiplier while animated. 1 = calm, 2 = excited. */
  energy?: number;
  /** Lantern bloom. */
  glow?: boolean;
  className?: string;
  /** Accessible description; omit for purely decorative instances. */
  label?: string;
}

export default function PixelMascot({
  pose = "idle",
  size = 64,
  animated = false,
  energy = 1,
  glow = true,
  className = "",
  label,
}: PixelMascotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live values for the animation loop, so a pose change never restarts it and
  // resets the bob phase mid-float.
  const live = useRef({ pose, energy, glow });
  useEffect(() => {
    live.current = { pose, energy, glow };
  }, [pose, energy, glow]);

  const context = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return null;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    ctx.imageSmoothingEnabled = false;
    return ctx;
  };

  // Still instances: paint once, and again only when what's drawn changes.
  useEffect(() => {
    if (animated && !prefersReducedMotion()) return;
    const ctx = context();
    if (!ctx) return;
    paint(ctx, FRAMES[pose] ?? FRAMES.idle, { ...STILL, glow: glow ? STILL.glow : 0 });
  }, [animated, pose, glow, size]);

  // Animated instances: one loop for the lifetime of the component.
  useEffect(() => {
    if (!animated || prefersReducedMotion()) return;
    const ctx = context();
    if (!ctx) return;

    let raf = 0;
    let start = 0;
    // Blinks are scheduled rather than rolled per frame, so they read as
    // deliberate instead of as flicker.
    let nextBlinkAt = 1200 + Math.random() * 2600;
    let blinkUntil = -1;

    const frame = (now: number) => {
      if (!start) start = now;
      const elapsedMs = now - start;
      const t = elapsedMs / 1000;
      const { pose, energy, glow } = live.current;
      const speed = Math.max(0, energy);

      let shown = pose;
      if (BLINKING_POSES.has(pose)) {
        if (blinkUntil < 0 && elapsedMs > nextBlinkAt) blinkUntil = elapsedMs + 110;
        if (blinkUntil >= 0) {
          if (elapsedMs < blinkUntil) shown = "blink";
          else {
            blinkUntil = -1;
            nextBlinkAt = elapsedMs + 1600 + Math.random() * 3400;
          }
        }
      }

      paint(ctx, FRAMES[shown] ?? FRAMES.idle, {
        bobPx: Math.round(Math.sin(t * 2.1 * speed) * 1.2),
        wingSpread: 0.62 + 0.38 * Math.abs(Math.sin(t * 6.5 * speed)),
        glow: glow ? 0.55 + 0.45 * Math.sin(t * 2.4 * speed) : 0,
      });

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [animated]);

  return (
    <canvas
      ref={canvasRef}
      className={`pixelated shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
