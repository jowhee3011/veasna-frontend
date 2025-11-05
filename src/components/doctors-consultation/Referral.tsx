"use client"

import { calculateAge } from "@/helper/calculate_age";
import { postReferral } from "@/lib/api/visit/postReferral";
import { Referral } from "@/lib/types/consultation";
import { PatientInfo, QueuedPatient } from "@/lib/types/patient";
import { useUserStore } from "@/stores/useUserStore";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface Props {
  patient: QueuedPatient;
  patientInfo: PatientInfo;
  retrievedReferral: Referral | null
  onClose: () => void;
  onReferralSaved?: () => void;
}

export default function ReferralForm({ patient, patientInfo, retrievedReferral, onClose, onReferralSaved }: Props) {
  // Get today's date in YYYY-MM-DD format as default
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [referralDate, setReferralDate] = useState<string>(getTodayDate());
  const [referralType, setReferralType] = useState<string[]>([]);
  const [illness, setIllness] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const user = useUserStore((state) => state.user);

  // Update form fields when retrievedReferral changes
  useEffect(() => {
    if (retrievedReferral) {
      setReferralDate(retrievedReferral.referralDate || getTodayDate());
      setReferralType(retrievedReferral.referralType || []);
      setIllness(retrievedReferral.illness || "");
      setDuration(retrievedReferral.duration || "");
      setReason(retrievedReferral.reason || "");
    } else {
      // Reset to defaults if no referral
      setReferralDate(getTodayDate());
      setReferralType([]);
      setIllness("");
      setDuration("");
      setReason("");
    }
  }, [retrievedReferral]);

  const handleSave = async () => {
    // Validation
    if (!referralDate || referralDate.trim() === "") {
      toast.error("Please select a referral date");
      return;
    }

    if (referralType.length === 0) {
      toast.error("Please select at least one referral type");
      return;
    }

    if (!illness || illness.trim() === "") {
      toast.error("Please enter the patient's illness");
      return;
    }

    if (!duration || duration.trim() === "") {
      toast.error("Please enter the illness duration");
      return;
    }

    if (!reason || reason.trim() === "") {
      toast.error("Please enter the reason for referral");
      return;
    }

    const data: Referral = {
      referralDate: referralDate,
      referralType: referralType,
      illness: illness,
      duration: duration,
      reason: reason,
    };
    
    try {
      await postReferral(data, patient.visit_id);
      toast.success("Referral saved successfully");
      
      // Reload the consultation data to get the updated referral
      if (onReferralSaved) {
        onReferralSaved();
      }
      
      onClose();
    } catch (error) {
      toast.error("Failed to save referral");
      console.error("Save referral error:", error);
    }
  };

  return (
    <div className="px-6 py-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Referral</h2>

      <form className="flex flex-col space-y-6" onSubmit={(e) => e.preventDefault()}>
        {/* Date */}
        <div>
          <label className="flex items-center gap-x-4 font-medium">
            Date of Referral:
            <input
              type="date"
              className="border p-2 rounded flex-1 bg-white-default"
              value={referralDate}
              onChange={e => setReferralDate(e.target.value)}
              required
            />
          </label>
        </div>

        {/* Referral Types */}
        <div>
          <p className="font-medium mb-2">Referral Type Needed:</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              "MongKol Borey Hospital",
              "Poipett Referral Hospital",
              "SEVA",
              "Optometrist",
              "Dentist",
              "Bong Bondol",
            ].map((referral) => (
              <label key={referral} className="flex items-center gap-x-2">
                <input 
                  type="checkbox" 
                  name="referral" 
                  value={referral}
                  checked={referralType.includes(referral)}
                  onChange={(e) => {
                    const { checked, value } = e.target;
                    setReferralType((prev) => 
                      checked 
                        ? [...prev, value]
                        : prev.filter((item) => item !== value)
                    );
                  }}
                />
                {referral}
              </label>
            ))}
          </div>
        </div>

        {/* Patient Info */}
        <div>
          <p className="mb-2 font-medium">To whomever it may concern</p>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-x-2">
              <span>Patient Name:</span>
              <p>{patientInfo.english_name}</p>
            </label>
            <label className="flex items-center gap-x-2">
              <span>Patient Gender:</span>
              <p>{patientInfo.sex}</p>
            </label>
            <label className="flex items-center gap-x-2">
              <span>Patient Age:</span>
              <p>{calculateAge(patientInfo.date_of_birth)}</p>
            </label>
            <label className="flex items-center gap-x-2">
              <span>Patient Address:</span>
              <p>{patientInfo.address === "" ? "N/A" : patientInfo.address}</p>
            </label>
          </div>
        </div>

        {/* Condition */}
        <div>
          <p>
            The patient above has been suffering from{" "}
            <input
              className="border rounded p-1"
              placeholder="illness"
              value={illness}
              onChange={e => setIllness(e.target.value)}
              required
            />{" "}
            for{" "}
            <input
              className="border rounded p-1"
              placeholder="duration"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              required
            />
          </p>
        </div>

        {/* Reason */}
        <div>
          <p className="font-medium mb-2">Reason for referral:</p>
          <textarea 
            className="bg-white text-black border rounded p-2 w-full h-24" 
            value={reason}
            onChange={e => setReason(e.target.value)}
            required
          />
        </div>

        {/* Closing */}
        <p className="italic">Thank you.</p>
        <p>{user?.username}</p>

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            type="button"
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}