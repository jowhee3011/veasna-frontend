"use client";

import { useState } from "react";
import StationPageShell from "@/components/shared/StationPageShell";
import SevaNotesContainer from "@/components/seva/SevaNotesContainer";
import PatientContainer from "@/components/shared/read-only/patient-container/PatientContainer";
import TriageContainer from "@/components/shared/read-only/triage-container/TriageContainer";
import { QueuedPatient } from "@/lib/types/patient";

export default function Seva() {
  const [selectedPatient, setSelectedPatient] = useState<QueuedPatient | null>(null);

  return (
    <StationPageShell
      station="seva"
      selectedPatient={selectedPatient}
      onSelectPatient={setSelectedPatient}
    >
      {selectedPatient && (
        <div className="grid gap-5 lg:grid-cols-3">
          <PatientContainer selectedPatient={selectedPatient} />
          <TriageContainer selectedPatient={selectedPatient} />
          <SevaNotesContainer patient={selectedPatient} />
        </div>
      )}
    </StationPageShell>
  );
}
