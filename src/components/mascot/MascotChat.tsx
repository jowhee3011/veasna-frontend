"use client";

/**
 * The floating Veasna assistant.
 *
 * A launcher in the bottom-right corner opens a panel where staff can ask
 * about today's queue in plain language — "who's waiting for consult?",
 * "status of 12A" — instead of clicking through every station page.
 *
 * Everything is answered locally by lib/mascot/chat-engine from data the app
 * has already loaded, so it stays useful on a slow or offline-ish link.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PixelMascot from "./PixelMascot";
import StationPips from "./StationPips";
import { HELP_CHIPS, respond, type BotReply, type PatientCard } from "@/lib/mascot/chat-engine";
import { STATION_BY_ID, STATIONS, type VisitStatus } from "@/lib/mascot/stations";
import type { PoseName } from "@/lib/mascot/sprite";
import { useLocationStore } from "@/stores/useLocationStore";
import { useUserStore } from "@/stores/useUserStore";
import { useScreeningStore } from "@/stores/useScreeningStore";
import { getQueue } from "@/lib/api/queue/getQueue";
import type { QueuedPatient } from "@/lib/types/patient";

interface Message {
  id: number;
  role: "user" | "bot";
  text: string;
  cards?: PatientCard[];
  chips?: string[];
}

/** How often the queue + station statuses re-sync while the panel is open. */
const REFRESH_MS = 45_000;

let messageId = 0;
const nextId = () => ++messageId;

export default function MascotChat() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [pose, setPose] = useState<PoseName>("idle");
  const [patients, setPatients] = useState<QueuedPatient[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const token = useUserStore((s) => s.user?.token);
  const username = useUserStore((s) => s.user?.username);
  const location = useLocationStore((s) => s.currentLocation);
  const statuses = useScreeningStore((s) => s.statuses);
  const isSyncing = useScreeningStore((s) => s.isSyncing);
  const lastSyncedAt = useScreeningStore((s) => s.lastSyncedAt);
  const syncQueue = useScreeningStore((s) => s.syncQueue);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ---- data ---- */

  const fetchQueue = useCallback(async () => {
    if (!token || !location) return [] as QueuedPatient[];
    const date = new Date().toISOString().slice(0, 10);
    const queue = await getQueue(location.id, date, token);
    const list: QueuedPatient[] = Array.isArray(queue) ? queue : [];
    setPatients(list);
    return list;
  }, [token, location]);

  const sync = useCallback(async () => {
    const list = await fetchQueue();
    if (token && list.length) await syncQueue(list, token);
  }, [fetchQueue, syncQueue, token]);

  // The launcher badge needs the head-count, which is one cheap request. The
  // per-visit fan-out that fills in station progress waits until the panel is
  // actually open.
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    if (!open) return;
    sync();
    const timer = setInterval(sync, REFRESH_MS);
    return () => clearInterval(timer);
  }, [open, sync]);

  const ctx = useMemo(
    () => ({
      patients,
      statuses,
      locationName: location?.name,
      userName: username,
      isSyncing,
    }),
    [patients, statuses, location?.name, username, isSyncing]
  );

  /* ---- conversation ---- */

  // The engine must see the freshest context at the moment it answers, not the
  // snapshot captured when `ask` was created.
  const ctxRef = useRef(ctx);
  useEffect(() => {
    ctxRef.current = ctx;
  }, [ctx]);

  const pushBot = useCallback((reply: BotReply) => {
    setPose(reply.pose ?? "talking");
    setMessages((m) => [
      ...m,
      { id: nextId(), role: "bot", text: reply.text, cards: reply.cards, chips: reply.chips },
    ]);
    // Settle back to idle so the mascot isn't stuck mid-expression.
    window.setTimeout(() => setPose("idle"), 2600);
  }, []);

  const ask = useCallback(
    (raw: string) => {
      const question = raw.trim();
      if (!question) return;
      setMessages((m) => [...m, { id: nextId(), role: "user", text: question }]);
      setInput("");
      setThinking(true);
      setPose("thinking");
      // A brief pause reads as considered rather than as a lookup table.
      window.setTimeout(() => {
        setThinking(false);
        pushBot(respond(question, ctxRef.current));
      }, 420);
    },
    [pushBot]
  );

  // Greeting, once, on first open.
  useEffect(() => {
    if (!open || messages.length) return;
    const t = window.setTimeout(
      () =>
        pushBot({
          pose: "happy",
          text: `Hi${username ? ` ${username}` : ""}! I'm Veasna. I'm watching today's queue${
            location?.name ? ` at ${location.name}` : ""
          } — ask me where any patient has got to.`,
          chips: HELP_CHIPS,
        }),
      260
    );
    return () => clearTimeout(t);
  }, [open, messages.length, username, location?.name, pushBot]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  /* ---- shortcuts ---- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---- derived badge ---- */

  const waitingForConsult = useMemo(
    () =>
      patients.filter(
        (p) => statuses[p.visit_id]?.stations.find((s) => s.id === "consultation")?.state !== "done"
      ).length,
    [patients, statuses]
  );

  const openCard = (card: PatientCard) => {
    setExpanded((e) => (e === card.visitId ? null : card.visitId));
  };

  return (
    <>
      {/* ---------------- Launcher ---------------- */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Veasna assistant" : "Open Veasna assistant"}
        aria-expanded={open}
        className={`fixed bottom-6 right-6 z-[60] grid h-16 w-16 place-items-center rounded-full border border-border bg-card shadow-[var(--shadow-lg)] transition-transform duration-300 hover:scale-105 active:scale-95 ${
          open ? "scale-90 opacity-0 pointer-events-none" : ""
        }`}
      >
        <PixelMascot pose="idle" size={52} animated />
        {!open && patients.length > 0 && (
          <span className="absolute -right-1 -top-1 min-w-6 rounded-full bg-[var(--lantern)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--lantern-foreground)] shadow-[var(--shadow-sm)]">
            {patients.length}
          </span>
        )}
      </button>

      {/* ---------------- Panel ---------------- */}
      {open && (
        <div
          role="dialog"
          aria-label="Veasna assistant"
          className="fixed bottom-6 right-6 z-[60] flex h-[min(640px,calc(100vh-3rem))] w-[min(420px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-xl)] animate-pop-in"
        >
          {/* Header */}
          <header className="relative flex items-center gap-3 border-b border-border bg-[var(--primary-soft)] px-4 py-3">
            <div className="relative">
              <PixelMascot pose={thinking ? "thinking" : pose} size={44} animated energy={thinking ? 1.6 : 1} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight text-[var(--primary-strong)]">Veasna</p>
              <p className="truncate text-xs text-muted-foreground">
                {isSyncing
                  ? "Syncing today's queue…"
                  : location?.name
                    ? `${patients.length} in queue · ${location.name}`
                    : "No location selected"}
              </p>
            </div>
            <button
              onClick={sync}
              title="Refresh queue"
              aria-label="Refresh queue"
              className="rounded-lg p-2 text-[var(--primary-strong)] transition hover:bg-card/70"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={isSyncing ? "animate-spin" : ""}>
                <path d="M21 12a9 9 0 1 1-2.6-6.4" />
                <path d="M21 3v6h-6" />
              </svg>
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-lg p-2 text-[var(--primary-strong)] transition hover:bg-card/70"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="scroll-slim flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end animate-slide-up">
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-[var(--primary)] px-3.5 py-2 text-sm text-[var(--primary-foreground)] shadow-[var(--shadow-xs)]">
                    {m.text}
                  </p>
                </div>
              ) : (
                <div key={m.id} className="flex gap-2.5 animate-slide-up">
                  <PixelMascot pose="idle" size={28} glow={false} className="mt-1" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2 text-sm leading-relaxed text-foreground">
                      {m.text}
                    </p>

                    {m.cards?.map((card) => (
                      <PatientResultCard
                        key={card.visitId}
                        card={card}
                        status={statuses[card.visitId] ?? card.status}
                        expanded={expanded === card.visitId}
                        onToggle={() => openCard(card)}
                        onOpen={() => {
                          router.push(`/patient-details?id=${card.patientId}`);
                          setOpen(false);
                        }}
                      />
                    ))}

                    {m.chips && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {m.chips.map((chip) => (
                          <button
                            key={chip}
                            onClick={() => ask(chip)}
                            className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-[var(--primary)] hover:text-[var(--primary-strong)]"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {thinking && (
              <div className="flex items-center gap-2.5 animate-fade-in">
                <PixelMascot pose="thinking" size={28} glow={false} animated energy={1.8} />
                <span className="flex gap-1 rounded-2xl rounded-tl-sm bg-muted px-3.5 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                      style={{ animation: `veasna-typing 1.1s ease-in-out ${i * 0.16}s infinite` }}
                    />
                  ))}
                </span>
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="border-t border-border bg-card px-3 py-3"
          >
            <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-1.5 focus-within:border-[var(--primary)]">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a patient or station…"
                aria-label="Ask Veasna"
                className="flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send"
                className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] transition disabled:opacity-35"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12l16-8-6 8 6 8z" />
                </svg>
              </button>
            </div>
            <p className="mt-2 px-1 text-[11px] text-muted-foreground">
              {lastSyncedAt
                ? `Queue synced ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Waiting for first sync"}
              {waitingForConsult > 0 && ` · ${waitingForConsult} awaiting consult`}
            </p>
          </form>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

function PatientResultCard({
  card,
  status,
  expanded,
  onToggle,
  onOpen,
}: {
  card: PatientCard;
  status: VisitStatus | null;
  expanded: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const next = status?.nextStation ? STATION_BY_ID[status.nextStation] : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-muted/60">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--primary-soft)] font-mono text-xs font-bold text-[var(--primary-strong)]">
          {card.queueNo}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{card.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {next ? `Next: ${next.label}` : status ? "Journey complete" : card.subtitle}
          </span>
        </span>
        <StationPips status={status} />
      </button>

      {expanded && (
        <div className="space-y-1.5 border-t border-border px-3 py-2.5 animate-fade-in">
          {STATIONS.map((s) => {
            const entry = status?.stations.find((x) => x.id === s.id);
            const state = entry?.state ?? "pending";
            return (
              <div key={s.id} className="flex items-center gap-2 text-xs">
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold ${
                    state === "done"
                      ? "bg-[var(--success)] text-white"
                      : state === "current"
                        ? "bg-[var(--lantern)] text-[var(--lantern-foreground)]"
                        : "border border-border text-muted-foreground"
                  }`}
                >
                  {state === "done" ? "✓" : state === "current" ? "•" : ""}
                </span>
                <span className={state === "done" ? "text-foreground" : "text-muted-foreground"}>{s.label}</span>
                <span className="ml-auto truncate pl-2 text-right text-muted-foreground">{entry?.detail ?? "—"}</span>
              </div>
            );
          })}
          <button
            onClick={onOpen}
            className="mt-1 w-full rounded-lg bg-[var(--primary)] py-1.5 text-xs font-semibold text-[var(--primary-foreground)] transition hover:opacity-90"
          >
            Open patient record
          </button>
        </div>
      )}
    </div>
  );
}
