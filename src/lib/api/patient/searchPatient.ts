// src/lib/api/patient/searchPatient.ts
import { backend_url } from "@/constants/env_variable";
import { PatientInfo } from "@/lib/types/patient";
import formatDate from "@/helper/format_date";

export interface SearchPatientResponse {
  found: boolean;
  count: number;
  patients: PatientInfo[];
}

export async function searchPatient(
  searchName: string,
  token: string
): Promise<SearchPatientResponse> {
  if (!searchName || searchName.trim().length === 0) {
    return { found: false, count: 0, patients: [] };
  }

  try {
    const res = await fetch(
      `${backend_url}/api/patient/search?name=${encodeURIComponent(searchName)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Search failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // Format date_of_birth for all patients
    const formattedPatients = data.patients.map((patient: any) => ({
      ...patient,
      date_of_birth: formatDate(patient.date_of_birth)
    }));

    return {
      found: data.found,
      count: data.count,
      patients: formattedPatients
    };
  } catch (err) {
    console.error('Search patient error:', err);
    throw err;
  }
}