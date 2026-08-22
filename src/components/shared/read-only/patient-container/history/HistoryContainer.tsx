"use client";

import { useState } from "react";
import HistoryPopUp from "./HistoryPopUp";
import { QueuedPatient } from "@/lib/types/patient";

interface Props {
  patient: QueuedPatient;
}

/**
 * Opens the patient's triage history in a dialog.
 *
 * The drag-to-move state this component used to hold went with the old
 * floating panel — the dialog centres itself, so there is nothing to position.
 */
export default function HistoryContainer({ patient }: Props) {
  const [showPopUp, setShowPopUp] = useState(false);

  return (
    <div>
      <h2 className="mb-2 text-sm font-bold tracking-tight text-foreground">Patient History</h2>

      <button
        onClick={() => setShowPopUp(true)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-left transition hover:border-[var(--primary)] hover:bg-[var(--primary-soft)]"
      >
        <span className="text-xs font-medium text-muted-foreground">
          Past, drug, family and social history
        </span>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-[var(--primary-strong)]"
          aria-hidden
        >
          <path d="M15 3h6v6M10 14 21 3M18 13v8H3V6h8" />
        </svg>
      </button>

      {showPopUp && <HistoryPopUp patient={patient} onClose={() => setShowPopUp(false)} />}
    </div>
  );
}
