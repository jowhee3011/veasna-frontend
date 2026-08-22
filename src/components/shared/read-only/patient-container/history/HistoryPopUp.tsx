"use client";

/**
 * Patient history, shown as a centred dialog.
 *
 * The previous version was a free-floating draggable panel positioned at
 * `left: 0; top: 0`, so it opened in the top-left corner half off-screen, over
 * a backdrop that declared `bg-opacity-30` without a background colour and so
 * dimmed nothing. It also rendered read-only prose into <textarea> elements.
 *
 * This is a plain dialog instead: dimmed backdrop, centred, scrollable body,
 * Escape and backdrop-click to close, and the history rendered as text.
 */

import { useEffect, useState } from "react";
import { getHistory } from "@/lib/api/visit/getHistory";
import { MedicalHistory } from "@/lib/types/medicalHistory";
import { QueuedPatient } from "@/lib/types/patient";
import Loading from "@/components/shared/Loading";
import PixelMascot from "@/components/mascot/PixelMascot";

interface Props {
  onClose: () => void;
  patient: QueuedPatient;
}

const SECTIONS: Array<{ key: keyof MedicalHistory; label: string }> = [
  { key: "past", label: "Past medical history" },
  { key: "drug_and_treatment", label: "Drug and treatment history" },
  { key: "family", label: "Family history" },
  { key: "social", label: "Social history" },
  { key: "systems_review", label: "Systems review" },
];

export default function HistoryPopUp({ onClose, patient }: Props) {
  const [history, setHistory] = useState<MedicalHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getHistory(patient.patient_id, patient.visit_id)
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .catch((err) => {
        console.error("Failed to fetch patient history:", err);
        if (!cancelled) setHistory(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patient]);

  // Escape closes; the body is locked so the page behind doesn't scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const name = patient.english_name || patient.khmer_name || "this patient";
  const recorded = SECTIONS.filter(({ key }) => history?.[key]?.trim());

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-xl)] animate-pop-in"
      >
        {/* Header */}
        <header className="flex items-start gap-3 border-b border-border bg-[var(--primary-soft)] px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Patient history</p>
            <h2
              id="history-dialog-title"
              className="truncate text-lg font-bold tracking-tight text-[var(--primary-strong)]"
            >
              {name}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Queue {patient.queue_no} · recorded at triage
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close patient history"
            autoFocus
            className="rounded-lg p-2 text-[var(--primary-strong)] transition hover:bg-card/70"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </header>

        {/* Body */}
        <div className="scroll-slim flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <Loading />
          ) : recorded.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <PixelMascot pose="sleeping" size={56} glow={false} />
              <p className="text-sm font-medium text-foreground">No history recorded</p>
              <p className="max-w-[38ch] text-xs text-muted-foreground">
                Nothing was entered for this visit. It will appear here once triage saves the
                medical history tab.
              </p>
            </div>
          ) : (
            <dl className="space-y-4">
              {SECTIONS.map(({ key, label }) => {
                const value = history?.[key]?.trim();
                return (
                  <div key={key}>
                    <dt className="eyebrow mb-1">{label}</dt>
                    <dd
                      className={`whitespace-pre-wrap rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm leading-relaxed ${
                        value ? "text-foreground" : "italic text-muted-foreground"
                      }`}
                    >
                      {value || "Not recorded"}
                    </dd>
                  </div>
                );
              })}
            </dl>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> to close
          </p>
          <button
            onClick={onClose}
            className="rounded-lg bg-[var(--primary)] px-4 py-1.5 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
