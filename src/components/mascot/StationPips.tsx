"use client";

/**
 * A compact read-out of one visit's journey: one pip per station, coloured by
 * state. Used inside queue rows and the chatbot's patient cards, where there
 * is no room for the full progress rail.
 */

import { STATIONS, STATION_BY_ID, type StationId, type VisitStatus } from "@/lib/mascot/stations";

const STATE_CLASS: Record<string, string> = {
  done: "bg-[var(--success)] border-[var(--success)]",
  current: "bg-[var(--lantern)] border-[var(--lantern)] animate-glow",
  pending: "bg-transparent border-border",
  skipped: "bg-transparent border-border/60 border-dashed",
};

interface Props {
  status: VisitStatus | null;
  /** Show station initials under each pip. */
  labelled?: boolean;
  className?: string;
}

export default function StationPips({ status, labelled = false, className = "" }: Props) {
  if (!status) {
    return (
      <div className={`flex items-center gap-1 ${className}`} aria-label="Station progress loading">
        {STATIONS.map((s) => (
          <span key={s.id} className="h-2 w-2 rounded-full skeleton" />
        ))}
      </div>
    );
  }

  const byId = new Map(status.stations.map((s) => [s.id as StationId, s]));

  return (
    <div className={`flex items-end gap-1.5 ${className}`}>
      {STATIONS.map((station) => {
        const entry = byId.get(station.id);
        const state = entry?.state ?? "pending";
        return (
          <div key={station.id} className="flex flex-col items-center gap-1">
            <span
              className={`h-2.5 w-2.5 rounded-full border-2 transition-colors ${STATE_CLASS[state]}`}
              title={`${STATION_BY_ID[station.id].label} — ${entry?.detail ?? "not started"}`}
            />
            {labelled && (
              <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                {station.short.slice(0, 3)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
