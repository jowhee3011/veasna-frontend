"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StationPips from "@/components/mascot/StationPips";
import PixelMascot from "@/components/mascot/PixelMascot";
import { STATION_BY_ID } from "@/lib/mascot/stations";
import { useScreeningStore } from "@/stores/useScreeningStore";
import { QueuedPatient } from "@/lib/types/patient";
import { byQueueNumber } from "@/helper/queue_order";

type Filter = "all" | "waiting" | "done";

interface Props {
  patients: QueuedPatient[];
}

export function PatientQueue({ patients }: Props) {
  const router = useRouter();
  const statuses = useScreeningStore((s) => s.statuses);
  const isSyncing = useScreeningStore((s) => s.isSyncing);

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    let done = 0;
    for (const p of patients) if (statuses[p.visit_id]?.nextStation === null) done++;
    return { all: patients.length, done, waiting: patients.length - done };
  }, [patients, statuses]);

  const visible = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return patients
      .filter((patient) => {
        if (filter !== "all") {
          const complete = statuses[patient.visit_id]?.nextStation === null;
          if (filter === "done" && !complete) return false;
          if (filter === "waiting" && complete) return false;
        }
        if (!query) return true;
        return (
          (patient.english_name?.toLowerCase() || "").includes(query) ||
          (patient.khmer_name?.toLowerCase() || "").includes(query) ||
          (patient.queue_no?.toString().toLowerCase() || "").includes(query)
        );
      })
      .sort(byQueueNumber);
  }, [patients, statuses, searchQuery, filter]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]">
      {/* Header */}
      <header className="border-b border-border px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="eyebrow">Today&apos;s queue</p>
            <h2 className="text-lg font-bold text-foreground">
              {counts.all} {counts.all === 1 ? "patient" : "patients"}
            </h2>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {today}
          </span>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Name or queue number…"
            aria-label="Search the queue"
            className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-[var(--primary)]"
          />
        </div>

        {/* Filters */}
        <div className="mt-3 flex gap-1 rounded-xl bg-muted p-1">
          {([
            ["all", "All", counts.all],
            ["waiting", "In progress", counts.waiting],
            ["done", "Complete", counts.done],
          ] as const).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                filter === key
                  ? "bg-card text-foreground shadow-[var(--shadow-xs)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
              <span className="ml-1.5 opacity-60">{count}</span>
            </button>
          ))}
        </div>
      </header>

      {/* List */}
      <div className="scroll-slim stagger flex-1 space-y-2 overflow-y-auto p-3">
        {visible.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <PixelMascot pose={patients.length ? "thinking" : "sleeping"} size={64} />
            <p className="text-sm font-medium text-foreground">
              {searchQuery || filter !== "all"
                ? "Nothing matches that filter"
                : "No patients registered yet"}
            </p>
            <p className="max-w-[26ch] text-xs text-muted-foreground">
              {searchQuery || filter !== "all"
                ? "Try clearing the search or switching back to All."
                : "Register the first patient with the form and they'll appear here."}
            </p>
          </div>
        ) : (
          visible.map((patient, i) => {
            const status = statuses[patient.visit_id] ?? null;
            const next = status?.nextStation ? STATION_BY_ID[status.nextStation] : null;
            const complete = status !== null && status.nextStation === null;

            return (
              <button
                key={`${patient.visit_id}`}
                onClick={() => router.push(`/patient-details?id=${patient.patient_id}`)}
                style={{ "--i": i } as React.CSSProperties}
                className="surface-hover w-full rounded-xl border border-border bg-card p-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-mono text-sm font-bold ${
                      complete
                        ? "bg-[var(--success-soft)] text-[var(--success)]"
                        : "bg-[var(--primary-soft)] text-[var(--primary-strong)]"
                    }`}
                  >
                    {patient.queue_no}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {patient.english_name || patient.khmer_name || "Unnamed patient"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[patient.khmer_name, patient.age ? `${patient.age}y` : null, patient.sex]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <span className="shrink-0 text-right text-[11px] text-muted-foreground">
                    {patient.timestamp}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/70 pt-2.5">
                  <span className="truncate text-[11px] font-medium">
                    {isSyncing && !status ? (
                      <span className="text-muted-foreground">Checking stations…</span>
                    ) : complete ? (
                      <span className="text-[var(--success)]">✓ All stations complete</span>
                    ) : next ? (
                      <span className="text-muted-foreground">
                        Next: <span className="text-foreground">{next.label}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Awaiting sync</span>
                    )}
                  </span>
                  <StationPips status={status} />
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
