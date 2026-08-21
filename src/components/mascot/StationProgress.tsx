"use client";

/**
 * The screening journey rail.
 *
 * Shows every station for one visit, with Veasna hovering over wherever the
 * patient has got to. This is the piece that turns a set of disconnected
 * station pages into something staff can read as a single process.
 */

import Link from "next/link";
import PixelMascot from "./PixelMascot";
import {
  STATIONS,
  type StationId,
  type StationState,
  type VisitStatus,
} from "@/lib/mascot/stations";

interface Props {
  status: VisitStatus | null;
  /** Highlight the station the user is currently looking at. */
  activeStation?: StationId | null;
  /** Turn each node into a link to its station page. */
  linked?: boolean;
  className?: string;
}

const NODE: Record<StationState, string> = {
  done: "bg-[var(--success)] border-[var(--success)] text-white",
  current: "bg-[var(--lantern)] border-[var(--lantern)] text-[var(--lantern-foreground)]",
  pending: "bg-card border-border text-muted-foreground",
  skipped: "bg-card border-dashed border-border text-muted-foreground",
};

export default function StationProgress({
  status,
  activeStation = null,
  linked = true,
  className = "",
}: Props) {
  const byId = new Map(status?.stations.map((s) => [s.id, s]) ?? []);
  const currentIndex = status?.nextStation
    ? STATIONS.findIndex((s) => s.id === status.nextStation)
    : STATIONS.length - 1;

  // Percentage along the rail for the mascot, measured between node centres.
  const step = 100 / STATIONS.length;
  const mascotLeft = step * currentIndex + step / 2;

  return (
    <div className={`relative ${className}`}>
      {/* The firefly, hovering above the station in play */}
      <div
        className="pointer-events-none absolute -top-1 z-10 hidden -translate-x-1/2 transition-[left] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:block"
        style={{ left: `${mascotLeft}%` }}
        aria-hidden
      >
        <PixelMascot pose={status?.nextStation ? "working" : "cheer"} size={38} energy={1.2} />
      </div>

      <div className="relative flex items-start pt-9">
        {/* Rail */}
        <div className="absolute left-0 right-0 top-[3.05rem] h-1 rounded-full bg-border" aria-hidden />
        <div
          className="absolute left-0 top-[3.05rem] h-1 rounded-full bg-[var(--success)] transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${(status?.ratio ?? 0) * 100}%` }}
          aria-hidden
        />

        {STATIONS.map((station) => {
          const entry = byId.get(station.id);
          const state: StationState = entry?.state ?? "pending";
          const isActive = activeStation === station.id;

          const node = (
            <>
              <span
                className={`relative z-[1] grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-bold shadow-[var(--shadow-xs)] transition-transform group-hover:scale-110 ${NODE[state]} ${
                  state === "current" ? "animate-glow" : ""
                }`}
              >
                {state === "done" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : state === "current" ? (
                  <span className="h-2 w-2 rounded-full bg-current" />
                ) : null}
              </span>
              <span
                className={`mt-2 text-center text-[11px] font-semibold leading-tight ${
                  isActive
                    ? "text-[var(--primary-strong)]"
                    : state === "done"
                      ? "text-foreground"
                      : "text-muted-foreground"
                }`}
              >
                {station.short}
              </span>
              <span className="mt-0.5 hidden text-center text-[10px] leading-tight text-muted-foreground md:block">
                {entry?.detail ?? "—"}
              </span>
            </>
          );

          const shell = `group flex flex-1 flex-col items-center px-1 ${
            isActive ? "rounded-lg bg-[var(--primary-soft)]/60 py-1" : ""
          }`;

          return linked ? (
            <Link key={station.id} href={station.href} className={shell} title={station.blurb}>
              {node}
            </Link>
          ) : (
            <div key={station.id} className={shell} title={station.blurb}>
              {node}
            </div>
          );
        })}
      </div>
    </div>
  );
}
