"use client";

import { useState } from "react";
import StationPageShell from "@/components/shared/StationPageShell";
import StationWorkspace from "@/components/shared/StationWorkspace";
import DoctorsNotesContainer from "@/components/doctors-consultation/DoctorsNotesContainer";
import PatientContainer from "@/components/shared/read-only/patient-container/PatientContainer";
import TriageContainer from "@/components/shared/read-only/triage-container/TriageContainer";
import { QueuedPatient } from "@/lib/types/patient";

export default function DoctorsConsultation() {
  const [selectedPatient, setSelectedPatient] = useState<QueuedPatient | null>(null);

  return (
    <StationPageShell
      station="consultation"
      selectedPatient={selectedPatient}
      onSelectPatient={setSelectedPatient}
    >
      {selectedPatient && (
        <StationWorkspace
          reference={<PatientContainer selectedPatient={selectedPatient} />}
          triage={<TriageContainer selectedPatient={selectedPatient} />}
          work={<DoctorsNotesContainer patient={selectedPatient} />}
        />
      )}
    </StationPageShell>
  );
}
