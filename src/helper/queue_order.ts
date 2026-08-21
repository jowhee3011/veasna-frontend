import { QueuedPatient } from "@/lib/types/patient";

/**
 * The canonical ordering for today's queue.
 *
 * Queue numbers are issued as a number with an optional letter suffix ("12",
 * "12A"), where the suffix marks someone slotted in against an existing
 * number. Sorting the raw strings would put "10" before "9", so the number is
 * compared numerically first and the suffix only breaks ties.
 *
 * Note: a bare number sorts *after* its lettered siblings (12A, then 12),
 * which is the behaviour the queue panel has always had. If that reads wrong
 * on the floor, the "ZZ" sentinel below is the one line to change.
 */
export function byQueueNumber(a: QueuedPatient, b: QueuedPatient): number {
  const parts = (queueNo: string) => {
    const match = (queueNo || "").match(/^(\d+)([A-Za-z]?)$/);
    return match
      ? { number: parseInt(match[1], 10), suffix: match[2] || "ZZ" }
      : { number: Number.MAX_SAFE_INTEGER, suffix: queueNo || "" };
  };

  const left = parts(a.queue_no);
  const right = parts(b.queue_no);
  return left.number !== right.number
    ? left.number - right.number
    : left.suffix.localeCompare(right.suffix);
}

export default byQueueNumber;
