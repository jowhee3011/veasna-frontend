/**
 * The screening journey.
 *
 * A patient moves through a fixed set of stations in a screening session.
 * The backend has no single "status" column — completion is implied by which
 * per-visit records exist. This module is the one place that mapping lives, so
 * the progress bar, the coach and the chatbot all agree on what "done" means.
 */

export type StationId =
  | "registration"
  | "triage"
  | "seva"
  | "physiotherapy"
  | "consultation"
  | "pharmacy";

export type StationState = "done" | "current" | "pending" | "skipped";

export interface Station {
  id: StationId;
  label: string;
  /** Compact label for the progress rail. */
  short: string;
  href: string;
  /** What happens here, in the coach's words. */
  blurb: string;
  /** Optional stations don't block the journey when empty. */
  optional?: boolean;
}

export const STATIONS: Station[] = [
  {
    id: "registration",
    label: "Registration",
    short: "Register",
    href: "/",
    blurb: "Take the patient's details and give them a queue number.",
  },
  {
    id: "triage",
    label: "Triage",
    short: "Triage",
    href: "/triage",
    blurb: "Vitals, presenting complaint, history and visual acuity.",
  },
  {
    id: "seva",
    label: "Seva",
    short: "Seva",
    href: "/seva",
    blurb: "Eye screening and refraction follow-up.",
    optional: true,
  },
  {
    id: "physiotherapy",
    label: "Physiotherapy",
    short: "Physio",
    href: "/physiotherapy",
    blurb: "Pain mapping and physiotherapy notes.",
    optional: true,
  },
  {
    id: "consultation",
    label: "Consultation",
    short: "Consult",
    href: "/doctors-consultation",
    blurb: "Doctor's assessment, prescription and referrals.",
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    short: "Pharmacy",
    href: "/pharmacy",
    blurb: "Dispense against the prescription.",
    optional: true,
  },
];

export const STATION_BY_ID: Record<StationId, Station> = Object.fromEntries(
  STATIONS.map((s) => [s.id, s])
) as Record<StationId, Station>;


/**
 * The shape returned by GET /api/patient/visit/:id. Only the fields that
 * decide completion are typed here — the endpoint returns considerably more.
 */
export interface VisitStatusSource {
  visit_id: number;
  patient_id?: number;
  queue_no?: string;
  location_name?: string;
  last_updated_at?: string;
  vitals?: unknown | null;
  hef?: unknown | null;
  visual_acuity?: unknown | null;
  presenting_complaint?: unknown | null;
  history?: unknown | null;
  seva?: unknown | null;
  physiotherapy?: unknown | null;
  consultation?: { notes?: string; prescription?: string; require_referral?: boolean } | null;
  referrals?: unknown[];
}

export interface StationProgress {
  id: StationId;
  state: StationState;
  /** Short human-readable reason, e.g. "vitals + complaint recorded". */
  detail: string;
}

export interface VisitStatus {
  visitId: number;
  stations: StationProgress[];
  /** First station that still needs work, or null when the journey is done. */
  nextStation: StationId | null;
  /** Completion across the non-optional stations, 0..1. */
  ratio: number;
  requiresReferral: boolean;
  referralCount: number;
}

/** Derive per-station completion from a visit record. */
export function deriveStatus(visit: VisitStatusSource): VisitStatus {
  const has = (v: unknown) => v !== null && v !== undefined;

  const triageParts = [
    has(visit.vitals) && "vitals",
    has(visit.presenting_complaint) && "complaint",
    has(visit.history) && "history",
    has(visit.visual_acuity) && "visual acuity",
  ].filter(Boolean) as string[];

  const consultation = visit.consultation ?? null;
  const referralCount = visit.referrals?.length ?? 0;

  const raw: Array<{ id: StationId; done: boolean; detail: string }> = [
    {
      id: "registration",
      done: true,
      detail: visit.queue_no ? `queue ${visit.queue_no}` : "registered",
    },
    {
      id: "triage",
      // Vitals alone isn't triage — registration can capture those. Triage is
      // only complete once clinical questioning has been recorded too.
      done: has(visit.presenting_complaint) || has(visit.history),
      detail: triageParts.length ? triageParts.join(", ") + " recorded" : "nothing recorded yet",
    },
    {
      id: "seva",
      done: has(visit.seva),
      detail: has(visit.seva) ? "eye screening recorded" : "no eye screening",
    },
    {
      id: "physiotherapy",
      done: has(visit.physiotherapy),
      detail: has(visit.physiotherapy) ? "physio notes recorded" : "no physio notes",
    },
    {
      id: "consultation",
      done: has(consultation),
      detail: consultation
        ? consultation.prescription
          ? "seen, prescription written"
          : "seen by doctor"
        : "not seen yet",
    },
    {
      id: "pharmacy",
      // There is no pharmacy dispensing record per visit; a prescription on the
      // consultation is the only signal the app has that pharmacy is involved.
      done: Boolean(consultation?.prescription),
      detail: consultation?.prescription
        ? "prescription ready to dispense"
        : "no prescription",
    },
  ];

  const required = raw.filter((r) => !STATION_BY_ID[r.id].optional);
  const firstIncomplete = required.find((r) => !r.done);

  const stations: StationProgress[] = raw.map((r) => {
    let state: StationState;
    if (r.done) state = "done";
    else if (firstIncomplete && r.id === firstIncomplete.id) state = "current";
    else if (STATION_BY_ID[r.id].optional) state = "skipped";
    else state = "pending";
    return { id: r.id, state, detail: r.detail };
  });

  const requiredDone = required.filter((r) => r.done).length;

  return {
    visitId: visit.visit_id,
    stations,
    nextStation: firstIncomplete ? firstIncomplete.id : null,
    ratio: required.length ? requiredDone / required.length : 0,
    requiresReferral: Boolean(consultation?.require_referral) || referralCount > 0,
    referralCount,
  };
}

/** One-line summary the chatbot and tooltips can print. */
export function summarise(status: VisitStatus): string {
  if (!status.nextStation) return "All stations complete — ready to go home.";
  const station = STATION_BY_ID[status.nextStation];
  return `Waiting for ${station.label}.`;
}
