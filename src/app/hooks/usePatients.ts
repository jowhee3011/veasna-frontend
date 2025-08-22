import { useEffect, useState } from "react";
import { getPatients } from "@/lib/api/patient/getPatients";
import { Location } from "@/lib/types/location";
import { Patient } from "@/lib/types/patient";

export function usePatients(location: Location | null) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return; // Don't fetch if no location is given

    setLoading(true);
    setError(null);

    getPatients(location)
      .then((data) => {
        setPatients(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setLoading(false);
      });

  }, [location]);

  return { patients, loading, error };
}
