"use client"

import { useEffect, useState } from "react";
import SaveButton from "../shared/SaveButton";
import VerticalLabelInputPair from "../shared/VerticalLabelInputPair";
import ReferralButton from "../shared/read-only/patient-container/referral/ReferralButton";
import { PatientInfo, QueuedPatient } from "@/lib/types/patient";
import { getPatient } from "@/lib/api/patients/getPatient";
import toast from "react-hot-toast";
import Loading from "../shared/Loading";
import { Consultation, Referral } from "@/lib/types/consultation";
import { getConsultation } from "@/lib/api/visit/doctors-consultation/getConsultation";
import { postConsultation } from "@/lib/api/visit/doctors-consultation/postConsultation";

interface Props {
  patient: QueuedPatient;
  visitId: number;
}

export default function DoctorsNotesContainer({ patient, visitId }: Props) {
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null)
  const [notes, setNotes] = useState<string>("")
  const [prescription, setPrescription] = useState<string>("")
  const [requireReferral, setRequireReferral] = useState<boolean>(false)
  const [referral, setReferral] = useState<Referral | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch patient info
  useEffect(() => {
    if (!patient?.patient_id) {
      toast.error("Invalid patient ID provided!");
      setPatientInfo(null);
      return;
    }

    const fetchPatient = async () => {
      try {
        const data = await getPatient(patient.patient_id);
        setPatientInfo(data);
      } catch (err) {
        toast.error("Failed to fetch patient info!");
        console.error("Fetch patient error:", err);
        setPatientInfo(null);
      }
    };

    fetchPatient();
  }, [patient?.patient_id]);

  // Load consultation data (includes referral data from backend join)
  useEffect(() => {
    const loadConsultationData = async () => {
      if (!patient?.visit_id) {
        return;
      }

      setIsLoading(true);
      try {
        const data: Consultation | null = await getConsultation(patient.visit_id);

        if (!data) {
          // No consultation exists yet - set defaults
          setNotes("");
          setPrescription("");
          setRequireReferral(false);
          setReferral(null);
          return;
        }

        // Backend returns consultation with joined referral data
        setNotes(data.notes || "");
        setPrescription(data.prescription || "");
        setRequireReferral(data.requireReferral || false);
        setReferral(data.referral || null);

        toast.success("Data loaded successfully");
      } catch (error) {
        toast.error("Failed to load consultation data");
        console.error("Error loading consultation:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConsultationData();
  }, [patient?.visit_id]);

  // Reload consultation data after referral is saved
  const reloadConsultationData = async () => {
    if (!patient?.visit_id) return;

    try {
      const data: Consultation | null = await getConsultation(patient.visit_id);
      if (data) {
        setNotes(data.notes || "");
        setPrescription(data.prescription || "");
        setRequireReferral(data.requireReferral || false);
        setReferral(data.referral || null);
      }
    } catch (error) {
      console.error("Error reloading consultation:", error);
    }
  };

  const handleSave = async () => {
    const data: Consultation = {
      notes: notes,
      prescription: prescription,
      requireReferral: requireReferral,
      referral: referral
    }
    
    try {
      await postConsultation(data, patient.visit_id);
      toast.success("Consultation saved successfully");
    } catch (error) {
      toast.error("Failed to save consultation");
      console.error("Save error:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 bg-beige-default px-4 py-2 rounded-md border-[1px] lg:w-[30%]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 bg-beige-default px-4 py-2 rounded-md border-[1px] lg:w-[30%]">
      <h2 className="text-[20px] font-semibold">Consultation Notes</h2>
      <div className="flex w-full h-[40%]">
        <VerticalLabelInputPair 
          value={notes}
          onChangeFunction={setNotes}
        />
      </div>

      <h2 className="text-[20px] font-semibold">Prescription</h2>
      <div className="flex w-full h-[40%]">
        <VerticalLabelInputPair 
          value={prescription}
          onChangeFunction={setPrescription}
        />
      </div>

      <div className="flex gap-4">
        <h2 className="text-[20px] font-semibold">Referral Needed</h2>
        
        <div className="flex gap-2 items-center">
          <input
            type="radio"
            name="referralNeeded"
            value="yes"
            checked={requireReferral === true}
            onChange={() => setRequireReferral(true)}
          />
          <p>Yes</p>
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="radio"
            name="referralNeeded"
            value="no"
            checked={requireReferral === false}
            onChange={() => setRequireReferral(false)}
          />
          <p>No</p>
        </div>
      </div>

      {patientInfo === null && (
        <Loading />
      )}
      
      {requireReferral && patientInfo !== null && (
        <ReferralButton 
          patient={patient}
          patientInfo={patientInfo}
          retrievedReferral={referral}
          onReferralSaved={reloadConsultationData}
        />
      )}

      <div className="flex items-center justify-end">
        <SaveButton 
          onClick={handleSave}
        />
      </div>
    </div>
  )
}