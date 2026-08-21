"use client";

/**
 * Veasna's in-flow coaching.
 *
 * Each station page gets a short, situation-aware line from the mascot rather
 * than a static help panel: what to do here, what's blocking, what's next.
 * The point is that a volunteer who has never used the system can work out the
 * screening flow without being trained on it first.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PixelMascot from "./PixelMascot";
import { STATION_BY_ID, type StationId, type VisitStatus } from "@/lib/mascot/stations";
import type { PoseName } from "@/lib/mascot/sprite";

type Situation = "no-location" | "no-patient" | "ready" | "complete";

export interface MascotCoachProps {
  station: StationId;
  situation?: Situation;
  /** Who is on screen, if anyone. */
  patientName?: string;
  status?: VisitStatus | null;
  /** Extra line appended after the standard guidance. */
  note?: string;
  /** Persist dismissal under this key; omit to make it non-dismissible. */
  dismissKey?: string;
  className?: string;
}

/** What the mascot says when a patient is on screen and work can begin. */
const READY_LINE: Record<StationId, string> = {
  registration:
    "Fill in the patient's details and I'll assign them a queue number. Vitals here are optional — triage can take them.",
  triage:
    "Vitals first, then the presenting complaint and history. Save each tab as you go and I'll tick the station off.",
  seva: "Record the Snellen results with and without pinhole, then the diagnosis. Flag a referral if the vision needs follow-up.",
  physiotherapy:
    "Tap the body chart where it hurts, then write up your assessment. The pain points save with your notes.",
  consultation:
    "Everything triage, seva and physio recorded is on the left. Write your notes and prescription, and flag a referral if needed.",
  pharmacy:
    "Dispense against the prescription and keep the stock levels honest — the doctors read them before prescribing.",
};

const NO_PATIENT_LINE: Record<StationId, string> = {
  registration: "Ready when you are — start a new registration on the right.",
  triage: "Search a queue number above to pull up the patient you're triaging.",
  seva: "Search a queue number above to start an eye screening.",
  physiotherapy: "Search a queue number above to open a physiotherapy assessment.",
  consultation: "Search a queue number above and I'll bring up everything the other stations recorded.",
  pharmacy: "Search the inventory, or use the + button to add a drug.",
};

export default function MascotCoach({
  station,
  situation = "ready",
  patientName,
  status,
  note,
  dismissKey,
  className = "",
}: MascotCoachProps) {
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Read the dismissal after mount: touching localStorage during render would
  // desync the server-rendered markup.
  useEffect(() => {
    if (dismissKey) {
      try {
        setDismissed(localStorage.getItem(`veasna-coach:${dismissKey}`) === "1");
      } catch {
        /* private mode — just show the coach */
      }
    }
    setHydrated(true);
  }, [dismissKey]);

  const { line, pose, action } = useMemo((): {
    line: string;
    pose: PoseName;
    action?: { label: string; href: string };
  } => {
    if (situation === "no-location") {
      return {
        pose: "alert",
        line: "Pick a screening site from the location menu in the top bar — everything on this page is filtered by it.",
      };
    }
    if (situation === "no-patient") {
      return { pose: "thinking", line: NO_PATIENT_LINE[station] };
    }
    if (situation === "complete" || (status && !status.nextStation)) {
      return {
        pose: "cheer",
        line: patientName
          ? `${patientName} has been through every station. Nothing left to do here.`
          : "Every station is complete for this patient.",
      };
    }

    const base = READY_LINE[station];
    // When this station is already done, point at whatever is still open.
    if (status) {
      const here = status.stations.find((s) => s.id === station);
      if (here?.state === "done" && status.nextStation && status.nextStation !== station) {
        const next = STATION_BY_ID[status.nextStation];
        return {
          pose: "happy",
          line: `${station === "registration" ? "Registered" : `${STATION_BY_ID[station].label} done`}${
            patientName ? ` for ${patientName}` : ""
          }. ${next.label} is next: ${next.blurb.toLowerCase()}`,
          action: { label: `Go to ${next.label}`, href: next.href },
        };
      }
    }
    return { pose: "talking", line: base };
  }, [situation, station, status, patientName]);

  if (!hydrated || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    if (dismissKey) {
      try {
        localStorage.setItem(`veasna-coach:${dismissKey}`, "1");
      } catch {
        /* nothing to persist to — dismissal lasts for this page view */
      }
    }
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-xs)] animate-slide-up ${className}`}
    >
      <PixelMascot pose={pose} size={46} energy={1.1} className="-mt-1" />

      <div className="min-w-0 flex-1">
        {/* Speech tail */}
        <div className="relative rounded-xl rounded-tl-sm bg-muted px-3.5 py-2.5">
          <span
            className="absolute -left-1.5 top-3 h-3 w-3 rotate-45 bg-muted"
            aria-hidden
          />
          <p className="relative text-sm leading-relaxed text-foreground text-balance">{line}</p>
          {note && <p className="relative mt-1.5 text-xs text-muted-foreground">{note}</p>}
        </div>

        {action && (
          <Link
            href={action.href}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] transition hover:opacity-90"
          >
            {action.label}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        )}
      </div>

      {dismissKey && (
        <button
          onClick={dismiss}
          aria-label="Dismiss tip"
          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      )}
    </div>
  );
}
