"use client";

import { useState } from "react";
import StationPageShell from "@/components/shared/StationPageShell";
import StationWorkspace from "@/components/shared/StationWorkspace";
import PhysiotherapyNotesContainer from "@/components/physiotherapy/PhysiotherapyNotesContainer";
import PatientContainer from "@/components/shared/read-only/patient-container/PatientContainer";
import TriageContainer from "@/components/shared/read-only/triage-container/TriageContainer";
import { QueuedPatient } from "@/lib/types/patient";
import { SET_LOCATION_MESSAGE } from "@/messages/info";
import { useLocationStore } from "@/stores/useLocationStore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function Physiotherapy() {
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
      station="physiotherapy"
      selectedPatient={selectedPatient}
      onSelectPatient={setSelectedPatient}
    >
      {selectedPatient && (
        <StationWorkspace
          reference={<PatientContainer selectedPatient={selectedPatient} />}
          triage={<TriageContainer selectedPatient={selectedPatient} />}
          work={<PhysiotherapyNotesContainer patient={selectedPatient} />}
        />
      )}
    </StationPageShell>
  );
}
