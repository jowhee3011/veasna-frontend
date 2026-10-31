"use client";

import { useState } from "react";
import StationPageShell from "@/components/shared/StationPageShell";
import StationWorkspace from "@/components/shared/StationWorkspace";
import DoctorsNotesContainer from "@/components/doctors-consultation/DoctorsNotesContainer";
import PatientContainer from "@/components/shared/read-only/patient-container/PatientContainer";
import TriageContainer from "@/components/shared/read-only/triage-container/TriageContainer";
import { QueuedPatient } from "@/lib/types/patient";
import { useEffect, useState } from "react";
import NoPatientSelected from "@/components/shared/NoPatientSelected";
import { SET_LOCATION_MESSAGE } from "@/messages/info";
import toast from "react-hot-toast";
import { useLocationStore } from "@/stores/useLocationStore";

export default function DoctorsConsultation() {
  const location = useLocationStore((state) => state.currentLocation);
  const [selectedPatient, setSelectedPatient] = useState<QueuedPatient | null>(null);

  useEffect(() => {
    if (!location) {
      toast(SET_LOCATION_MESSAGE);
    }
  }, [location]);

  if (!selectedPatient) {
      return (
      <div className="flex flex-col w-full h-screen gap-y-5">
          <SearchBar onSelectPatient={setSelectedPatient} />
          <NoPatientSelected/>
      </div>
      );
  }

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
