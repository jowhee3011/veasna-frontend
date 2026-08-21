"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { PatientQueue } from "@/components/home/PatientQueue";
import { PatientForm } from "@/components/home/PatientForm";
import PixelMascot from "@/components/mascot/PixelMascot";
import MascotCoach from "@/components/mascot/MascotCoach";
import { STATIONS } from "@/lib/mascot/stations";
import { getPatientsByLocation } from "@/lib/api/patients/getPatientsByLocation";
import { getQueue } from "@/lib/api/queue/getQueue";
import { PatientInfo, QueuedPatient } from "@/lib/types/patient";
import { SET_LOCATION_MESSAGE } from "@/messages/info";
import { useLocationStore } from "@/stores/useLocationStore";
import { useScreeningStore } from "@/stores/useScreeningStore";
import { useUserStore } from "@/stores/useUserStore";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const username = useUserStore((state) => state.user?.username);
  const token = useUserStore((state) => state.user?.token);
  const location = useLocationStore((state) => state.currentLocation);

  const statuses = useScreeningStore((state) => state.statuses);
  const syncQueue = useScreeningStore((state) => state.syncQueue);
  const isSyncing = useScreeningStore((state) => state.isSyncing);

  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [queuePatients, setQueuePatients] = useState<QueuedPatient[]>([]);

  const refreshQueue = useCallback(async () => {
    if (!token || !location) return;
    const date = new Date().toISOString().slice(0, 10);
    const queue = await getQueue(location.id, date, token);
    const list: QueuedPatient[] = Array.isArray(queue) ? queue : [];
    setQueuePatients(list);
    // Fill in each visit's station progress so the queue rows show live pips.
    await syncQueue(list, token);
  }, [token, location, syncQueue]);

  useEffect(() => {
    if (!location) {
      toast(SET_LOCATION_MESSAGE);
      return;
    }
    if (!token) return;
    getPatientsByLocation(location.id, token).then((db) => setPatients(db ?? []));
    refreshQueue();
  }, [location, token, refreshQueue]);

  /* ---- session stats ---- */

  const stats = useMemo(() => {
    const total = queuePatients.length;
    const loaded = queuePatients.filter((p) => statuses[p.visit_id]);
    const complete = loaded.filter((p) => statuses[p.visit_id].nextStation === null).length;
    const referrals = loaded.filter((p) => statuses[p.visit_id].requiresReferral).length;
    const awaitingConsult = loaded.filter(
      (p) => statuses[p.visit_id].stations.find((s) => s.id === "consultation")?.state !== "done"
    ).length;
    return { total, complete, referrals, awaitingConsult, inProgress: total - complete };
  }, [queuePatients, statuses]);

  /** Per-station completion, for the session overview bar. */
  const stationLoad = useMemo(
    () =>
      STATIONS.filter((s) => s.id !== "registration").map((station) => {
        const done = queuePatients.filter(
          (p) => statuses[p.visit_id]?.stations.find((x) => x.id === station.id)?.state === "done"
        ).length;
        return {
          ...station,
          done,
          ratio: queuePatients.length ? done / queuePatients.length : 0,
        };
      }),
    [queuePatients, statuses]
  );

  return (
    <div className="space-y-6">
      {/* ---------------- Hero ---------------- */}
      <header className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]">
        <div className="relative flex flex-wrap items-center gap-5 bg-gradient-to-r from-[var(--primary-soft)] via-card to-[var(--lantern-soft)] px-6 py-5">
          <PixelMascot
            pose={stats.total ? "happy" : "idle"}
            size={72}
            energy={1.15}
            label="Veasna, the screening assistant"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {greeting()}
              {username ? `, ${username}` : ""}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {location
                ? stats.total
                  ? `${stats.total} ${stats.total === 1 ? "patient" : "patients"} through the door at ${location.name} — ${stats.complete} finished, ${stats.inProgress} still moving.`
                  : `No one registered at ${location.name} yet. Ready when the first patient arrives.`
                : "Choose a screening site from the location menu to begin."}
            </p>
          </div>

          <dl className="flex flex-wrap gap-2">
            <Stat label="Registered" value={stats.total} tone="primary" />
            <Stat label="In progress" value={stats.inProgress} tone="lantern" />
            <Stat label="Complete" value={stats.complete} tone="success" />
            {stats.referrals > 0 && <Stat label="Referrals" value={stats.referrals} tone="destructive" />}
          </dl>
        </div>

        {/* Station load bar */}
        {stats.total > 0 && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border px-6 py-4 sm:grid-cols-3 lg:grid-cols-5">
            {stationLoad.map((station) => (
              <div key={station.id}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">{station.short}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {station.done}/{stats.total}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ width: `${station.ratio * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* ---------------- Coach ---------------- */}
      <MascotCoach
        station="registration"
        situation={!location ? "no-location" : "ready"}
        dismissKey="home"
        note={
          isSyncing
            ? "I'm checking where everyone has got to — the queue pips will fill in shortly."
            : "Tip: press ⌘K any time to ask me where a patient has got to."
        }
      />

      {/* ---------------- Work area ---------------- */}
      <div className="grid gap-6 xl:grid-cols-[minmax(320px,380px)_1fr]">
        <div className="h-[calc(100vh-16rem)] min-h-[520px]">
          <PatientQueue patients={queuePatients} />
        </div>
        <div className="min-w-0">
          <PatientForm
            existingPatients={patients}
            onSubmit={refreshQueue}
            locationId={location?.id}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const TONE: Record<string, string> = {
  primary: "bg-[var(--primary-soft)] text-[var(--primary-strong)]",
  lantern: "bg-[var(--lantern-soft)] text-[var(--lantern-ink)]",
  success: "bg-[var(--success-soft)] text-[var(--success)]",
  destructive: "bg-[var(--destructive-soft)] text-[var(--destructive)]",
};

function Stat({ label, value, tone }: { label: string; value: number; tone: keyof typeof TONE }) {
  return (
    <div className={`rounded-xl px-3.5 py-2 ${TONE[tone]}`}>
      <dd className="text-xl font-bold leading-none tabular-nums">{value}</dd>
      <dt className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</dt>
    </div>
  );
}
