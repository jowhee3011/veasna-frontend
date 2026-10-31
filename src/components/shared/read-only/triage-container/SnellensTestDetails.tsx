"use client";

import { QueuedPatient } from "@/lib/types/patient";
import { useEffect, useState } from "react";
import { getVisualAcuity } from "@/lib/api/visit/getSnellensTest";
import { VisualAcuity } from "@/lib/types/visualAcuity";
import Loading from "../../Loading";
import NoDataAvailable from "../../NoDataAvailable";
import { SNELLENS_TEST } from "@/constants/strings";
import ReadOnlyField from "../ReadOnlyField";

interface Props {
  patient: QueuedPatient;
}

export default function SnellensTestDetails({ patient }: Props) {
  const [visualAcuity, setVisualAcuity] = useState<VisualAcuity | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVisualAcuity = async () => {
      setLoading(true);
      try {
        const data = await getVisualAcuity(patient.patient_id, patient.visit_id);
        setVisualAcuity(data);
      } catch (err) {
        console.error("Failed to fetch visual acuity:", err);
        setVisualAcuity(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVisualAcuity();
  }, [patient]);

  if (loading) {
    return (
      <Loading />
    );
  }

  if (!visualAcuity) {
    return (
      <NoDataAvailable dataString={SNELLENS_TEST}/>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <h2 className="text-sm font-bold tracking-tight text-foreground">Snellen&apos;s Test</h2>

      {/* A real table: the row labels are long and the value columns are two
          characters wide, so an even 3-column grid wasted the space and forced
          "With Pinhole" to wrap. */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="py-1.5 text-left text-xs font-semibold text-muted-foreground">Visual acuity</th>
            <th className="w-16 py-1.5 text-center text-xs font-semibold text-muted-foreground">Left</th>
            <th className="w-16 py-1.5 text-center text-xs font-semibold text-muted-foreground">Right</th>
          </tr>
        </thead>
        <tbody>
          {([
            ["With pinhole", visualAcuity.left_with_pinhole, visualAcuity.right_with_pinhole],
            ["Without pinhole", visualAcuity.left_without_pinhole, visualAcuity.right_without_pinhole],
          ] as const).map(([label, left, right]) => (
            <tr key={label} className="border-b border-border/60 last:border-b-0">
              <td className="py-1.5 text-muted-foreground">{label}</td>
              <td className="py-1.5 text-center font-semibold tabular-nums text-foreground">{left || "—"}</td>
              <td className="py-1.5 text-center font-semibold tabular-nums text-foreground">{right || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-1">
        <ReadOnlyField label="Additional notes" value={visualAcuity.notes} />
      </div>
    </div>
  )
}
