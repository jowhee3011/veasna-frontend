// src/lib/api/patient/deletePatient.ts
import { backend_url } from "@/constants/env_variable";
import { clearPatientCache } from "./getPatients";

export async function deletePatient(
  patientId: number, 
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${backend_url}/api/patient/${patientId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 404) {
      console.error(`Patient ${patientId} not found`);
      return { success: false, error: 'Patient not found' };
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete patient: ${res.statusText}`);
    }

    const data = await res.json();

    // Clear cache for this patient
    clearPatientCache(patientId);

    console.log(`DELETE Patient ${patientId} (Success)`, data.message);
    return { success: true };
  } catch (err: any) {
    console.error('DELETE Patient (Error):', err);
    return { 
      success: false, 
      error: err.message || 'An error occurred while deleting patient' 
    };
  }
}