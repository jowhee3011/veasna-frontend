"use client";

import { useState } from "react";
import StationPageShell from "@/components/shared/StationPageShell";
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
        <div className="grid gap-5 lg:grid-cols-3">
          <PatientContainer selectedPatient={selectedPatient} />
          <TriageContainer selectedPatient={selectedPatient} />
          <DoctorsNotesContainer patient={selectedPatient} />
        </div>
      )}
    </StationPageShell>
  );
}
