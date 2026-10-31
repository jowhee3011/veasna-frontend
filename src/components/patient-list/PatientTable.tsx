import React from "react";
import { PatientInfo } from "@/lib/types/patient";
import { PatientTableRow } from "./PatientTableRow";
import PixelMascot from "@/components/mascot/PixelMascot";

interface PatientTableProps {
  patients: PatientInfo[];
  onViewPatient?: (patientId: number) => void;
  onDeletePatient?: (patientId: number) => void;
}

const COLUMNS = [
  { label: "Patient", className: "w-[22%]" },
  { label: "Date of birth", className: "w-[12%]" },
  { label: "Age", className: "w-[6%]" },
  { label: "Sex", className: "w-[6%]" },
  { label: "Phone", className: "w-[12%]" },
  { label: "Address", className: "w-[20%]" },
  { label: "Last updated", className: "w-[14%]" },
  { label: "", className: "w-[8%]" },
];

export function PatientTable({ patients, onViewPatient, onDeletePatient }: PatientTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]">
      <div className="scroll-slim overflow-x-auto">
        <table className="w-full min-w-[900px] table-fixed border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/60">
              {COLUMNS.map((col, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground ${col.className}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="stagger divide-y divide-border">
            {patients.map((patient, i) => (
              <PatientTableRow
                key={patient.id}
                index={i}
                patient={patient}
                onViewPatient={onViewPatient}
                onDeletePatient={onDeletePatient}
              />
            ))}
          </tbody>
        </table>
      </div>

      {patients.length === 0 && (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <PixelMascot pose="thinking" size={72} />
          <h3 className="text-lg font-bold text-foreground">No patients found</h3>
          <p className="max-w-[42ch] text-sm text-muted-foreground">
            Nothing matches that search. Check the spelling, or switch to a different screening
            site from the location menu.
          </p>
        </div>
      )}
    </div>
  );
}
