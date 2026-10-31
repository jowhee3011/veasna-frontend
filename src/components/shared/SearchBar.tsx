"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import StationPips from "@/components/mascot/StationPips";
import { getQueue } from "@/lib/api/queue/getQueue";
import { QueuedPatient } from "@/lib/types/patient";
import { SET_LOCATION_MESSAGE } from "@/messages/info";
import { useLocationStore } from "@/stores/useLocationStore";
import { useScreeningStore } from "@/stores/useScreeningStore";
import { useUserStore } from "@/stores/useUserStore";

interface SearchBarProps {
  onSelectPatient?: (patient: QueuedPatient) => void;
  /** Currently selected patient, so the bar can show it as a chip. */
  selected?: QueuedPatient | null;
  placeholder?: string;
}

/**
 * Queue lookup for the station pages. Matches on queue number *or* name — at a
 * busy screening the queue slip is often the only thing to hand, but staff
 * also arrive knowing the patient by name.
 */
export default function SearchBar({
  onSelectPatient,
  selected,
  placeholder = "Search by queue number or name…",
}: SearchBarProps) {
  const token = useUserStore((state) => state.user?.token);
  const location = useLocationStore((state) => state.currentLocation);
  const statuses = useScreeningStore((state) => state.statuses);
  const syncQueue = useScreeningStore((state) => state.syncQueue);

  const [patients, setPatients] = useState<QueuedPatient[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      if (!token) return;
      if (!location) {
        toast(SET_LOCATION_MESSAGE);
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      const queue = await getQueue(location.id, date, token);
      const list: QueuedPatient[] = Array.isArray(queue) ? queue : [];
      setPatients(list);
      syncQueue(list, token);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, token]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients.slice(0, 8);
    return patients
      .filter(
        (p) =>
          (p.queue_no || "").toLowerCase().includes(q) ||
          (p.english_name || "").toLowerCase().includes(q) ||
          (p.khmer_name || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [patients, query]);

  const select = (patient: QueuedPatient) => {
    setQuery("");
    setOpen(false);
    setHighlighted(-1);
    onSelectPatient?.(patient);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") return setOpen(false);
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = highlighted >= 0 ? results[highlighted] : results[0];
      if (pick) select(pick);
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-xl border border-input bg-card px-3 py-1 shadow-[var(--shadow-xs)] transition focus-within:border-[var(--primary)]">
        <svg className="h-4 w-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>

        {selected && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--primary-soft)] py-1 pl-2 pr-1 text-xs font-semibold text-[var(--primary-strong)]">
            <span className="font-mono">{selected.queue_no}</span>
            <span className="max-w-[14ch] truncate">{selected.english_name}</span>
          </span>
        )}

        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlighted(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={selected ? "Switch patient…" : placeholder}
          aria-label="Search patients in today's queue"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
        />

        <span className="shrink-0 text-xs text-muted-foreground">
          {patients.length} in queue
        </span>
      </div>

      {open && results.length > 0 && (
        <ul className="scroll-slim absolute z-30 mt-1.5 max-h-80 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-[var(--shadow-lg)] animate-pop-in">
          {results.map((patient, i) => (
            <li key={patient.visit_id}>
              <button
                onMouseEnter={() => setHighlighted(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(patient);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition ${
                  i === highlighted ? "bg-[var(--primary-soft)]" : "hover:bg-muted"
                }`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted font-mono text-xs font-bold text-foreground">
                  {patient.queue_no}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {patient.english_name || patient.khmer_name || "Unnamed"}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[patient.khmer_name, patient.age ? `${patient.age}y` : null, patient.sex]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <StationPips status={statuses[patient.visit_id] ?? null} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() && results.length === 0 && (
        <div className="absolute z-30 mt-1.5 w-full rounded-xl border border-border bg-popover px-4 py-3 text-sm text-muted-foreground shadow-[var(--shadow-lg)]">
          No one in today&apos;s queue matches “{query}”.
        </div>
      )}
    </div>
  );
}
