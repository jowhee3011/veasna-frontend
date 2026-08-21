import { create } from "zustand";
import { getVisit } from "@/lib/api/visit/getVisit";
import { deriveStatus, type VisitStatus } from "@/lib/mascot/stations";
import type { QueuedPatient } from "@/lib/types/patient";

/**
 * Per-visit station progress for everyone in today's queue.
 *
 * The API has no bulk "status of every visit" endpoint, so this fans out over
 * GET /api/patient/visit/:id. That request layer already does ETag/304
 * revalidation, which keeps repeat syncs cheap; the concurrency cap below is
 * what keeps a 60-patient queue from opening 60 sockets at once.
 */

const CONCURRENCY = 6;

interface ScreeningState {
  statuses: Record<number, VisitStatus>;
  isSyncing: boolean;
  lastSyncedAt: number | null;

  syncQueue: (patients: QueuedPatient[], token: string) => Promise<void>;
  refreshVisit: (visitId: number, token: string) => Promise<VisitStatus | null>;
}

/** Run `task` over `items`, at most `limit` in flight. */
async function pooled<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      await task(item);
    }
  });
  await Promise.all(workers);
}

export const useScreeningStore = create<ScreeningState>((set, get) => ({
  statuses: {},
  isSyncing: false,
  lastSyncedAt: null,

  syncQueue: async (patients, token) => {
    if (!token || patients.length === 0) {
      set({ lastSyncedAt: Date.now() });
      return;
    }
    if (get().isSyncing) return;

    set({ isSyncing: true });
    const collected: Record<number, VisitStatus> = {};

    try {
      await pooled(patients, CONCURRENCY, async (patient) => {
        const visit = await getVisit(patient.visit_id, token);
        if (visit) collected[patient.visit_id] = deriveStatus(visit);
      });

      set({
        // Merge rather than replace: a single-visit refresh that landed during
        // the sweep should not be thrown away.
        statuses: { ...get().statuses, ...collected },
        lastSyncedAt: Date.now(),
      });
    } finally {
      set({ isSyncing: false });
    }
  },

  refreshVisit: async (visitId, token) => {
    if (!token) return null;
    const visit = await getVisit(visitId, token);
    if (!visit) return null;
    const status = deriveStatus(visit);
    set({ statuses: { ...get().statuses, [visitId]: status } });
    return status;
  },
}));
