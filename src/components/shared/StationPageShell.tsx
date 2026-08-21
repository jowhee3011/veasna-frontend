"use client";

/**
 * Common chrome for the station pages (triage, seva, physio, consultation).
 *
 * Before this, each station was an isolated screen: search a queue number,
 * fill a form, and you'd have no idea what had already been done or what came
 * next. The shell adds the shared context — who is on screen, where they are
 * in the journey, and what Veasna suggests doing here.
 */

import { useEffect } from "react";
import SearchBar from "./SearchBar";
import PixelMascot from "@/components/mascot/PixelMascot";
import MascotCoach from "@/components/mascot/MascotCoach";
import StationProgress from "@/components/mascot/StationProgress";
import { STATION_BY_ID, type StationId } from "@/lib/mascot/stations";
import { useLocationStore } from "@/stores/useLocationStore";
import { useScreeningStore } from "@/stores/useScreeningStore";
import { useUserStore } from "@/stores/useUserStore";
import type { QueuedPatient } from "@/lib/types/patient";

interface Props {
  station: StationId;
  selectedPatient: QueuedPatient | null;
  onSelectPatient: (patient: QueuedPatient) => void;
  /** Rendered once a patient is selected. */
  children: React.ReactNode;
}

export default function StationPageShell({
  station,
  selectedPatient,
  onSelectPatient,
  children,
}: Props) {
  const meta = STATION_BY_ID[station];
  const location = useLocationStore((s) => s.currentLocation);
  const token = useUserStore((s) => s.user?.token);
  const statuses = useScreeningStore((s) => s.statuses);
  const refreshVisit = useScreeningStore((s) => s.refreshVisit);

  const status = selectedPatient ? statuses[selectedPatient.visit_id] ?? null : null;

  // Pull fresh station progress whenever a patient is opened — the visit may
  // have been written to at another station since the queue was last synced.
  useEffect(() => {
    if (selectedPatient && token) refreshVisit(selectedPatient.visit_id, token);
  }, [selectedPatient, token, refreshVisit]);

  const patientName =
    selectedPatient?.english_name || selectedPatient?.khmer_name || undefined;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Station</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{meta.label}</h1>
          <p className="mt-0.5 max-w-prose text-sm text-muted-foreground">{meta.blurb}</p>
        </div>
        {location && (
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
              <circle cx="12" cy="10" r="2.4" />
            </svg>
            {location.name}
          </span>
        )}
      </header>

      <SearchBar onSelectPatient={onSelectPatient} selected={selectedPatient} />

      {selectedPatient ? (
        <>
          {/* Journey rail for the selected patient */}
          <section className="rounded-2xl border border-border bg-card px-5 pb-4 pt-3 shadow-[var(--shadow-sm)]">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--primary-soft)] font-mono text-sm font-bold text-[var(--primary-strong)]">
                  {selectedPatient.queue_no}
                </span>
                <div>
                  <p className="text-sm font-bold leading-tight text-foreground">
                    {patientName ?? "Unnamed patient"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      selectedPatient.khmer_name,
                      selectedPatient.age ? `${selectedPatient.age}y` : null,
                      selectedPatient.sex,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
              </div>
              {status?.requiresReferral && (
                <span className="rounded-full bg-[var(--destructive-soft)] px-3 py-1 text-xs font-bold text-[var(--destructive)]">
                  Referral flagged
                </span>
              )}
            </div>
            <StationProgress status={status} activeStation={station} />
          </section>

          <MascotCoach
            station={station}
            situation={!location ? "no-location" : "ready"}
            patientName={patientName}
            status={status}
          />

          {children}
        </>
      ) : (
        <EmptyStation station={station} hasLocation={Boolean(location)} />
      )}
    </div>
  );
}

function EmptyStation({ station, hasLocation }: { station: StationId; hasLocation: boolean }) {
  return (
    <div className="space-y-5">
      <MascotCoach station={station} situation={hasLocation ? "no-patient" : "no-location"} />
      <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <PixelMascot pose="sleeping" size={88} />
        <div>
          <h2 className="text-lg font-bold text-foreground">No patient selected</h2>
          <p className="mx-auto mt-1 max-w-[42ch] text-sm text-muted-foreground">
            {hasLocation
              ? "Search a queue number or name above and I'll bring up everything recorded so far."
              : "Pick a screening site from the location menu first — the queue is filtered by site."}
          </p>
        </div>
      </div>
    </div>
  );
}
