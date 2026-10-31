import { QueuedPatient } from "@/lib/types/patient";
import PresentingComplaintsDetails from "./PresentingComplaintsDetails";
import SnellensTestDetails from "./SnellensTestDetails";

interface Props {
  selectedPatient: QueuedPatient
}

export default function TriageContainer({ selectedPatient }: Props) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
      <SnellensTestDetails patient={selectedPatient} />
      <PresentingComplaintsDetails patient={selectedPatient} />
    </div>
  )
}