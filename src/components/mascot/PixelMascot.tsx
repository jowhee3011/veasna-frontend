"use client";

/**
 * PixelMascot — renders Veasna the firefly onto a <canvas> with the raw 2D
 * context. No sprite sheets, no animation library: every frame is painted from
 * the character grid in lib/mascot/sprite.ts.
 *
 * Animation is done in the draw loop rather than with CSS so the pixels stay
 * on the sprite grid:
 *   - bob      vertical float, quantised to whole sprite pixels
 *   - flap     wing columns squashed toward the body centre
 *   - glow     additive bloom behind the lantern and antenna tips
 *   - blink    the eye rows swap for a couple of frames at random intervals
 */

import { useEffect, useRef } from "react";
import {
  FRAMES,
  PALETTE,
  SPRITE_H,
  SPRITE_W,
  WING_KEYS,
  EMISSIVE_KEYS,
  type PoseName,
} from "@/lib/mascot/sprite";

/** Canvas pixels per sprite pixel. Fixed, so the art never lands off-grid. */
const PX = 10;
/** Poses where an idle blink reads as natural. */
const BLINKING_POSES: PoseName[] = ["idle", "talking", "happy", "working", "thinking"];

export interface PixelMascotProps {
  pose?: PoseName;
  /** Rendered CSS size in px (square). */
  size?: number;
  /** Vertical float. */
  bob?: boolean;
  /** Wing flap. */
  flap?: boolean;
  /** Lantern bloom. */
  glow?: boolean;
  /** 0 = still, 1 = normal, 2 = excited. Scales every animation's speed. */
  energy?: number;
  className?: string;
  /** Accessible description; omit for purely decorative instances. */
  label?: string;
}

export default function PixelMascot({
  pose = "idle",
  size = 64,
  bob = true,
  flap = true,
  glow = true,
  energy = 1,
  className = "",
  label,
}: PixelMascotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Live props for the animation loop, so changing a prop never restarts it.
  const props = useRef({ pose, bob, flap, glow, energy });
  useEffect(() => {
    props.current = { pose, bob, flap, glow, energy };
  }, [pose, bob, flap, glow, energy]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const W = SPRITE_W * PX;
    const H = SPRITE_H * PX;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;

    const centreX = SPRITE_W / 2;
    let raf = 0;
    let start = 0;
    // Next blink is scheduled rather than random-per-frame, so blinks read as
    // deliberate instead of as flicker.
    let nextBlinkAt = 1200 + Math.random() * 2600;
    let blinkUntil = -1;
    let lastStaticPose: PoseName | null = null;

    function drawBloom(x: number, y: number, radius: number, alpha: number, colour: string) {
      const cx = (x + 0.5) * PX;
      const cy = (y + 0.5) * PX;
      const g = ctx!.createRadialGradient(cx, cy, 0, cx, cy, radius);
      g.addColorStop(0, colour);
      g.addColorStop(1, "transparent");
      ctx!.globalAlpha = alpha;
      ctx!.fillStyle = g;
      ctx!.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      ctx!.globalAlpha = 1;
    }

    function frame(now: number) {
      if (!start) start = now;
      const p = props.current;
      const e = reduceMotion ? 0 : Math.max(0, p.energy);
      const t = (now - start) / 1000;

      // ---- pose selection (auto-blink overlays the requested pose) ----
      let pose = p.pose;
      if (!reduceMotion && BLINKING_POSES.includes(pose)) {
        const ms = now - start;
        if (ms > nextBlinkAt && blinkUntil < 0) blinkUntil = ms + 110;
        if (blinkUntil > 0) {
          if (ms < blinkUntil) pose = "blink";
          else {
            blinkUntil = -1;
            nextBlinkAt = ms + 1600 + Math.random() * 3400;
          }
        }
      }
      const grid = FRAMES[pose] ?? FRAMES.idle;

      // Motion is off: repaint only when the pose actually changes.
      if (e === 0) {
        if (lastStaticPose === pose) {
          raf = requestAnimationFrame(frame);
          return;
        }
        lastStaticPose = pose;
      } else {
        lastStaticPose = null;
      }

      // ---- motion values ----
      // Bob is quantised to whole sprite pixels: sub-pixel drift would blur
      // the nearest-neighbour scaling that makes this read as pixel art.
      const bobPx = p.bob && e > 0 ? Math.round(Math.sin(t * 2.1 * e) * 1.2) : 0;
      const spread = p.flap && e > 0 ? 0.62 + 0.38 * Math.abs(Math.sin(t * 6.5 * e)) : 1;
      const glowPulse = 0.55 + 0.45 * Math.sin(t * 2.4 * (e || 1));

      ctx!.clearRect(0, 0, W, H);

      // ---- bloom pass, behind the sprite ----
      if (p.glow) {
        for (let y = 0; y < SPRITE_H; y++) {
          for (let x = 0; x < SPRITE_W; x++) {
            const key = grid[y][x];
            if (!EMISSIVE_KEYS.has(key)) continue;
            // Blooms stack additively, and the lantern glass alone is eight
            // pixels — so the per-pixel contribution has to stay low or the
            // whole sprite washes out at larger sizes.
            const flame = key === "L";
            drawBloom(
              x,
              y + bobPx,
              flame ? PX * 3.6 : PX * 1.8,
              (flame ? 0.34 : 0.13) * glowPulse,
              "#ffd457"
            );
          }
        }
      }

      // ---- sprite pass ----
      for (let y = 0; y < SPRITE_H; y++) {
        const row = grid[y];
        for (let x = 0; x < SPRITE_W; x++) {
          const key = row[x];
          if (key === ".") continue;
          const colour = PALETTE[key];
          if (!colour) continue;

          let drawX = x;
          if (WING_KEYS.has(key) && spread !== 1) {
            // Squash the wing toward the body centre, then re-snap to the grid.
            drawX = Math.round(centreX + (x - centreX) * spread);
          }

          ctx!.fillStyle = colour;
          ctx!.fillRect(drawX * PX, (y + bobPx) * PX, PX, PX);
        }
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

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
