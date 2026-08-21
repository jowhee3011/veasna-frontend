"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { FullSearchBar } from "@/components/patient-list/FullSearchBar";
import { PatientTable } from "@/components/patient-list/PatientTable";
import PixelMascot from "@/components/mascot/PixelMascot";
import { getPatientsByLocation } from "@/lib/api/patients/getPatientsByLocation";
import { PatientInfo } from "@/lib/types/patient";
import { SET_LOCATION_MESSAGE } from "@/messages/info";
import { useLocationStore } from "@/stores/useLocationStore";
import { useUserStore } from "@/stores/useUserStore";

export default function PatientListPage() {
  const router = useRouter();
  const location = useLocationStore((state) => state.currentLocation);
  const token = useUserStore((state) => state.user?.token);

  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!token || !location) return;
    setIsLoading(true);
    try {
      const db = await getPatientsByLocation(location.id, token);
      setPatients(Array.isArray(db) ? db : []);
    } finally {
      setIsLoading(false);
    }
  }, [token, location]);

  useEffect(() => {
    if (!location) {
      toast(SET_LOCATION_MESSAGE);
      setIsLoading(false);
      return;
    }
    refresh();
  }, [location, refresh]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        (p.english_name?.toLowerCase() || "").includes(q) ||
        (p.khmer_name?.toLowerCase() || "").includes(q) ||
        (p.phone_number?.toLowerCase() || "").includes(q)
    );
  }, [patients, searchTerm]);

  /** Rough demographic split, useful for a screening-day sanity check. */
  const breakdown = useMemo(() => {
    const male = patients.filter((p) => p.sex === "M").length;
    const female = patients.filter((p) => p.sex === "F").length;
    return { male, female, other: patients.length - male - female };
  }, [patients]);

  const handleDeletePatient = (patientId: number) => {
    if (!window.confirm("Delete this patient? This removes them from the local list only.")) return;
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
    toast.success("Removed from the list");
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <PixelMascot pose="working" size={54} />
          <div>
            <p className="eyebrow">Records</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Patient list</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {location
                ? `Everyone ever registered at ${location.name}.`
                : "Select a screening site to see its records."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <Chip label="Total" value={patients.length} />
          <Chip label="Male" value={breakdown.male} />
          <Chip label="Female" value={breakdown.female} />
          {searchTerm && <Chip label="Matching" value={filtered.length} highlight />}
        </div>
      </header>

      <FullSearchBar
        placeholder="Search by English name, Khmer name or phone number…"
        onSearchChange={setSearchTerm}
      />

      {isLoading ? (
        <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-12 w-full" />
          ))}
        </div>
      ) : (
        <PatientTable
          patients={filtered}
          onViewPatient={(id) => router.push(`/patient-details?id=${id}`)}
          onDeletePatient={handleDeletePatient}
        />
      )}
    </div>
  );
}

function Chip({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <span
      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
        highlight
          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-strong)]"
          : "border-border bg-card text-muted-foreground"
      }`}
    >
      {label} <span className="ml-1 tabular-nums text-foreground">{value}</span>
    </span>
  );
}
