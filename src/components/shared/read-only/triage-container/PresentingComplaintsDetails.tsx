"use client";

import { QueuedPatient } from "@/lib/types/patient";
import ReadOnlyField from "../ReadOnlyField";
import { useEffect, useState } from "react";
import { getPresentingComplaint } from "@/lib/api/visit/getPresentingComplaints";
import { PresentingComplaint } from "@/lib/types/medicalHistory";
import Loading from "../../Loading";
import NoDataAvailable from "../../NoDataAvailable";
import { PRESENTING_COMPLAINTS } from "@/constants/strings";

interface Props {
  patient: QueuedPatient;
}

export default function PresentingComplaintsDetails({ patient }: Props) {
  const [complaint, setComplaint] = useState<PresentingComplaint | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchComplaint = async () => {
      setLoading(true);
      try {
        const data = await getPresentingComplaint(patient.patient_id, patient.visit_id);
        setComplaint(data);
      } catch (err) {
        console.error("Failed to fetch presenting complaint:", err);
        setComplaint(null);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [patient]);

  if (loading) {
    return (
      <Loading />
    );
  }

  if (!complaint) {
    return (
      <NoDataAvailable dataString={PRESENTING_COMPLAINTS} />
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <h2 className="text-sm font-bold tracking-tight text-foreground">Presenting Complaints</h2>

      <ReadOnlyField label="History of Presenting Illness" value={complaint.history} />

      <ReadOnlyField label="Red Flags" value={complaint.red_flags} />

      <ReadOnlyField label="Systems Review" value={complaint.systems_review} />

      <ReadOnlyField label="Drug Allergies" value={complaint.drug_allergies} />
    </div>
  );
}
