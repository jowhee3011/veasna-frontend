import { QueuedPatient } from "@/lib/types/patient";
import PatientDetails from "./PatientDetails";
import VitalsDetails from "./VitalsDetails";
import HistoryContainer from "./history/HistoryContainer";

interface Props {
  selectedPatient: QueuedPatient;
}

export default function PatientContainer({ selectedPatient }: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
      <PatientDetails patient={selectedPatient} />
      <VitalsDetails patient={selectedPatient} />
      <HistoryContainer patient={selectedPatient} />
    </div>
  )
}