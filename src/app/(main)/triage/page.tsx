"use client";

import { useState } from "react";
import StationPageShell from "@/components/shared/StationPageShell";
import PatientDetails from "@/components/shared/read-only/patient-container/PatientDetails";
import { TriageTabs } from "@/components/triage/TriageTabs";
import { QueuedPatient } from "@/lib/types/patient";

export default function Triage() {
  const [selectedPatient, setSelectedPatient] = useState<QueuedPatient | null>(null);

  return (
    <StationPageShell
      station="triage"
      selectedPatient={selectedPatient}
      onSelectPatient={setSelectedPatient}
    >
      {selectedPatient && (
        <div className="grid gap-5 xl:grid-cols-[minmax(280px,340px)_1fr]">
          <aside className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
            <PatientDetails patient={selectedPatient} />
          </aside>
          <div className="min-w-0">
            <TriageTabs visit_id={selectedPatient.visit_id} />
          </div>
        </div>
      )}
    </StationPageShell>
  );
}
