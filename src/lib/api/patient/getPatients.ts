import { backend_url } from "@/constants/env_variable";
import { Location } from "@/lib/types/location";
import { Patient } from "@/lib/types/patient";

export async function getPatients({ id, name }: Location): Promise<Patient[]> {

  try {
    const query = new URLSearchParams();
    if (id) query.append("location_id", id.toString());
    if (name) query.append("location", name);

    const res = await fetch(`${backend_url}/api/patients?${query.toString()}`);

    if (!res.ok) {
      throw new Error(`Network response was not ok: ${res.status} ${res.statusText}`);
    }

    const data: Patient[] = await res.json();
    console.log("Get Patients:", data);
    return data;

  } catch (err) {
    console.error("GET error:", err);
    return [];
  }
}