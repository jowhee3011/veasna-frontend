"use client";

import { useState } from "react";
import StationPageShell from "@/components/shared/StationPageShell";
import StationWorkspace from "@/components/shared/StationWorkspace";
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
        <StationWorkspace
          reference={<PatientContainer selectedPatient={selectedPatient} />}
          triage={<TriageContainer selectedPatient={selectedPatient} />}
          work={<SevaNotesContainer patient={selectedPatient} />}
        />
      )}
    </StationPageShell>
  );
}
