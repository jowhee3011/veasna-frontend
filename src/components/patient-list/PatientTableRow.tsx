import formatDate from "@/helper/format_date";
import { calculateAge } from "@/helper/calculate_age";
import { PatientInfo } from "@/lib/types/patient";

interface PatientTableRowProps {
  patient: PatientInfo;
  index?: number;
  onViewPatient?: (patientId: number) => void;
  onDeletePatient?: (patientId: number) => void;
}

function initials(patient: PatientInfo) {
  const name = patient.english_name?.trim() || patient.khmer_name?.trim() || "";
  if (!name) return "—";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function PatientTableRow({
  patient,
  index = 0,
  onViewPatient,
  onDeletePatient,
}: PatientTableRowProps) {
  return (
    <tr
      style={{ "--i": index } as React.CSSProperties}
      className="group transition-colors hover:bg-[var(--primary-soft)]/40"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-[11px] font-bold text-[var(--primary-strong)]">
            {initials(patient)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {patient.english_name || "—"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{patient.khmer_name || "—"}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 text-sm text-muted-foreground">
        {patient.date_of_birth ? formatDate(patient.date_of_birth) : "—"}
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-foreground">
        {calculateAge(patient.date_of_birth) ?? "—"}
      </td>
      <td className="px-4 py-3">
        {patient.sex ? (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
            {patient.sex}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">
        {patient.phone_number || "—"}
      </td>
      <td className="truncate px-4 py-3 text-sm text-muted-foreground" title={patient.address ?? ""}>
        {patient.address || "—"}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {patient.last_updated_at ? new Date(patient.last_updated_at).toLocaleString() : "—"}
      </td>

      <td className="px-4 py-3">
        {/* Actions stay visible on touch devices, where there is no hover. */}
        <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            onClick={() => patient.id && onViewPatient?.(patient.id)}
            title="View patient record"
            aria-label={`View record for ${patient.english_name || "patient"}`}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary-strong)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <button
            onClick={() => patient.id && onDeletePatient?.(patient.id)}
            title="Delete patient"
            aria-label={`Delete ${patient.english_name || "patient"}`}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-[var(--destructive-soft)] hover:text-[var(--destructive)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}
