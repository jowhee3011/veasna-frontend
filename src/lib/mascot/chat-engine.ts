/**
 * Veasna's chat engine.
 *
 * A deliberately small, dependency-free intent matcher. It runs entirely in
 * the browser against data the app has already fetched — there is no model
 * call and no network round trip, so it works on a field laptop with no
 * internet as long as the screening API is reachable on the LAN.
 *
 * The approach: score each intent by keyword hits, resolve any patient or
 * station referred to in the message, then hand the winning intent a handler
 * that reads the queue and the derived station statuses.
 */

import type { QueuedPatient } from "@/lib/types/patient";
import { byQueueNumber } from "@/helper/queue_order";
import {
  STATIONS,
  STATION_BY_ID,
  summarise,
  type StationId,
  type VisitStatus,
} from "./stations";
import type { PoseName } from "./sprite";

export interface ChatContext {
  patients: QueuedPatient[];
  statuses: Record<number, VisitStatus>;
  locationName?: string;
  userName?: string;
  isSyncing: boolean;
}

export interface PatientCard {
  visitId: number;
  patientId: number;
  queueNo: string;
  name: string;
  subtitle: string;
  status: VisitStatus | null;
}

export interface BotReply {
  text: string;
  cards?: PatientCard[];
  chips?: string[];
  pose?: PoseName;
}

/* ------------------------------------------------------------------ *
 * Text helpers
 * ------------------------------------------------------------------ */

const normalise = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();

const STATION_KEYWORDS: Record<StationId, string[]> = {
  registration: ["registration", "register", "registered", "sign up", "signed up", "queue number"],
  triage: ["triage", "triaged", "vitals", "vital", "bp", "blood pressure", "temperature", "complaint", "complaints", "history"],
  seva: ["seva", "eye", "eyes", "vision", "sight", "snellen", "acuity", "optical", "glasses"],
  physiotherapy: ["physio", "physiotherapy", "pain", "painpoint", "musculoskeletal", "mobility"],
  consultation: ["consult", "consultation", "consulted", "doctor", "doctors", "dr", "physician", "seen"],
  pharmacy: ["pharmacy", "drug", "drugs", "medicine", "medicines", "medication", "prescription", "dispense", "dispensed"],
};

function findStation(text: string): StationId | null {
  let best: { id: StationId; len: number } | null = null;
  for (const station of STATIONS) {
    for (const kw of STATION_KEYWORDS[station.id]) {
      // Longest keyword wins, so "blood pressure" beats a stray "pressure".
      if (text.includes(kw) && (!best || kw.length > best.len)) {
        best = { id: station.id, len: kw.length };
      }
    }
  }
  return best ? best.id : null;
}

/** Queue numbers look like 12, 12A, A3. Pull any that appear in the message. */
function findQueueTokens(raw: string): string[] {
  const matches = raw.toUpperCase().match(/\b[0-9]{1,3}[A-Z]?\b|\b[A-Z][0-9]{1,3}\b/g);
  return matches ? Array.from(new Set(matches)) : [];
}

const displayName = (p: QueuedPatient) =>
  p.english_name?.trim() || p.khmer_name?.trim() || `Patient ${p.queue_no}`;

function toCard(p: QueuedPatient, ctx: ChatContext): PatientCard {
  const bits = [
    p.age !== undefined && p.age !== null ? `${p.age}y` : null,
    p.sex || null,
    p.khmer_name?.trim() || null,
  ].filter(Boolean);
  return {
    visitId: p.visit_id,
    patientId: p.patient_id,
    queueNo: p.queue_no,
    name: displayName(p),
    subtitle: bits.join(" · ") || "—",
    status: ctx.statuses[p.visit_id] ?? null,
  };
}

/**
 * Resolve which patients a message is about, by queue number first (exact,
 * then prefix) and by name second.
 */
function resolvePatients(raw: string, text: string, ctx: ChatContext): QueuedPatient[] {
  const tokens = findQueueTokens(raw);
  if (tokens.length) {
    const exact = ctx.patients.filter((p) =>
      tokens.includes((p.queue_no || "").toUpperCase())
    );
    if (exact.length) return exact;
  }

  // Name match: require 3+ characters so "is"/"of" can't match a name.
  const words = text.split(" ").filter((w) => w.length >= 3);
  const scored = ctx.patients
    .map((p) => {
      const eng = (p.english_name || "").toLowerCase();
      const khm = (p.khmer_name || "").toLowerCase();
      let score = 0;
      for (const w of words) {
        if (!eng && !khm) continue;
        if (eng === w || khm === w) score += 3;
        else if (eng.includes(w) || khm.includes(w)) score += 2;
      }
      return { p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length) return scored.slice(0, 5).map((s) => s.p);

  if (tokens.length) {
    const prefix = ctx.patients.filter((p) =>
      tokens.some((t) => (p.queue_no || "").toUpperCase().startsWith(t))
    );
    if (prefix.length) return prefix;
  }
  return [];
}

/* ------------------------------------------------------------------ *
 * Intents
 * ------------------------------------------------------------------ */

type Handler = (args: {
  raw: string;
  text: string;
  ctx: ChatContext;
  station: StationId | null;
  matches: QueuedPatient[];
}) => BotReply;

interface Intent {
  id: string;
  /** Phrases that raise this intent's score. */
  keywords: string[];
  /** Extra score when a patient was named in the message. */
  needsPatient?: boolean;
  needsStation?: boolean;
  handler: Handler;
}

const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;

const HELP_CHIPS = [
  "Queue summary",
  "Who's waiting for consult?",
  "Who still needs triage?",
  "Any referrals today?",
  "Status of queue 1",
];

const INTENTS: Intent[] = [
  {
    id: "help",
    keywords: ["help", "what can you do", "how do i use", "commands", "who are you", "what are you"],
    handler: () => ({
      pose: "happy",
      text:
        "I'm Veasna — I keep an eye on today's queue so you don't have to click through every page.\n\n" +
        "Try asking me:\n" +
        "• \"status of queue 12\" or \"how is Sok Dara\"\n" +
        "• \"who's waiting for consultation?\"\n" +
        "• \"who still needs triage?\"\n" +
        "• \"any referrals today?\"\n" +
        "• \"summary\" for the whole session at a glance",
      chips: HELP_CHIPS,
    }),
  },
  {
    id: "greeting",
    keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "sua sdei", "chum reap suor"],
    handler: ({ ctx }) => ({
      pose: "happy",
      text: `Hello${ctx.userName ? ` ${ctx.userName}` : ""}! ${
        ctx.patients.length
          ? `${plural(ctx.patients.length, "patient")} registered${
              ctx.locationName ? ` at ${ctx.locationName}` : ""
            } today. What would you like to know?`
          : "Nobody has been registered yet today."
      }`,
      chips: HELP_CHIPS,
    }),
  },
  {
    id: "thanks",
    keywords: ["thank", "thanks", "cheers", "nice one", "great job"],
    handler: () => ({
      pose: "cheer",
      text: "Any time. Shout if you need another look at the queue.",
    }),
  },
  {
    id: "patient_status",
    keywords: ["status", "where is", "where's", "how is", "hows", "how's", "progress", "up to", "done with", "finished", "check"],
    needsPatient: true,
    handler: ({ ctx, matches }) => {
      if (!matches.length) {
        return {
          pose: "thinking",
          text:
            "I couldn't find that patient in today's queue. Try their queue number, or check the location selector up top is set to the right site.",
          chips: ["Queue summary", "Help"],
        };
      }
      if (matches.length > 1) {
        return {
          pose: "thinking",
          text: `${matches.length} patients match that. Which one?`,
          cards: matches.map((p) => toCard(p, ctx)),
        };
      }
      const patient = matches[0];
      const status = ctx.statuses[patient.visit_id];
      if (!status) {
        return {
          pose: "thinking",
          text: ctx.isSyncing
            ? `Still loading ${displayName(patient)}'s stations — give me a second and ask again.`
            : `I have ${displayName(patient)} in the queue but haven't loaded their stations yet.`,
          cards: [toCard(patient, ctx)],
        };
      }
      const done = status.stations.filter((s) => s.state === "done").map((s) => STATION_BY_ID[s.id].label);
      const lines = [
        `${displayName(patient)} (queue ${patient.queue_no}) — ${summarise(status)}`,
        done.length ? `Completed: ${done.join(", ")}.` : "Nothing completed beyond registration yet.",
      ];
      if (status.requiresReferral) {
        lines.push(
          `⚠ Referral flagged${status.referralCount ? ` (${plural(status.referralCount, "referral")} on file)` : ""}.`
        );
      }
      return {
        pose: status.nextStation ? "talking" : "cheer",
        text: lines.join("\n"),
        cards: [toCard(patient, ctx)],
      };
    },
  },
  {
    id: "station_waiting",
    keywords: ["waiting", "waiting for", "queue for", "still need", "still needs", "not done", "not seen", "pending", "yet to", "outstanding", "remaining", "left to"],
    needsStation: true,
    handler: ({ ctx, station }) => {
      if (!station) {
        return {
          pose: "thinking",
          text: "Which station? I can check triage, seva, physiotherapy, consultation or pharmacy.",
          chips: STATIONS.filter((s) => s.id !== "registration").map((s) => `Who's waiting for ${s.label}?`),
        };
      }
      const label = STATION_BY_ID[station].label;
      const waiting = ctx.patients
        .filter((p) => {
          const st = ctx.statuses[p.visit_id];
          if (!st) return false;
          return st.stations.find((s) => s.id === station)?.state !== "done";
        })
        .sort(byQueueNumber);

      if (!waiting.length) {
        return {
          pose: "cheer",
          text: ctx.isSyncing
            ? `Still loading — ask again in a moment for an accurate ${label} count.`
            : `Nobody is waiting for ${label}. All caught up.`,
        };
      }
      return {
        pose: "alert",
        text: `${plural(waiting.length, "patient")} still ${waiting.length === 1 ? "needs" : "need"} ${label}:`,
        cards: waiting.slice(0, 12).map((p) => toCard(p, ctx)),
      };
    },
  },
  {
    id: "station_done",
    keywords: ["who has finished", "who finished", "who is done", "who's done", "completed", "already seen", "have been seen", "cleared"],
    needsStation: true,
    handler: ({ ctx, station }) => {
      if (!station) {
        return {
          pose: "thinking",
          text: "Which station should I check for completions?",
          chips: STATIONS.filter((s) => s.id !== "registration").map((s) => `Who has finished ${s.label}?`),
        };
      }
      const label = STATION_BY_ID[station].label;
      const done = ctx.patients
        .filter((p) => ctx.statuses[p.visit_id]?.stations.find((s) => s.id === station)?.state === "done")
        .sort(byQueueNumber);

      if (!done.length) {
        return { pose: "thinking", text: `No one has completed ${label} yet today.` };
      }
      return {
        pose: "happy",
        text: `${plural(done.length, "patient")} completed ${label}:`,
        cards: done.slice(0, 12).map((p) => toCard(p, ctx)),
      };
    },
  },
  {
    id: "next_patient",
    keywords: ["who is next", "who's next", "next patient", "next up", "call next"],
    needsStation: true,
    handler: ({ ctx, station }) => {
      const target = station && station !== "registration" ? station : null;
      const candidates = ctx.patients
        .filter((p) => {
          const st = ctx.statuses[p.visit_id];
          if (!st) return false;
          return target
            ? st.stations.find((s) => s.id === target)?.state !== "done"
            : st.nextStation !== null;
        })
        .sort(byQueueNumber);

      if (!candidates.length) {
        return { pose: "cheer", text: "Nobody is queued up right now — the floor is clear." };
      }
      const next = candidates[0];
      const label = target ? STATION_BY_ID[target].label : "their next station";
      return {
        pose: "alert",
        text: `Next for ${label}: ${displayName(next)}, queue ${next.queue_no}.`,
        cards: [toCard(next, ctx)],
      };
    },
  },
  {
    id: "referrals",
    keywords: ["referral", "referrals", "referred", "refer"],
    handler: ({ ctx }) => {
      const flagged = ctx.patients.filter((p) => ctx.statuses[p.visit_id]?.requiresReferral).sort(byQueueNumber);
      if (!flagged.length) {
        return { pose: "idle", text: "No referrals flagged today." };
      }
      return {
        pose: "alert",
        text: `${plural(flagged.length, "patient")} flagged for referral:`,
        cards: flagged.map((p) => toCard(p, ctx)),
        chips: ["Queue summary"],
      };
    },
  },
  {
    id: "summary",
    keywords: ["summary", "overview", "how many", "count", "total", "today", "session", "stats", "how are we doing", "progress overall"],
    handler: ({ ctx }) => {
      const total = ctx.patients.length;
      if (!total) {
        return {
          pose: "sleeping",
          text: `No patients registered${ctx.locationName ? ` at ${ctx.locationName}` : ""} today yet. I'll be here when the first one arrives.`,
        };
      }
      const loaded = ctx.patients.filter((p) => ctx.statuses[p.visit_id]);
      const complete = loaded.filter((p) => ctx.statuses[p.visit_id].nextStation === null).length;
      const referrals = loaded.filter((p) => ctx.statuses[p.visit_id].requiresReferral).length;

      const perStation = STATIONS.filter((s) => s.id !== "registration").map((s) => {
        const done = loaded.filter(
          (p) => ctx.statuses[p.visit_id].stations.find((x) => x.id === s.id)?.state === "done"
        ).length;
        return `• ${s.label}: ${done}/${total}`;
      });

      return {
        pose: "working",
        text: [
          `${plural(total, "patient")} registered${ctx.locationName ? ` at ${ctx.locationName}` : ""} today.`,
          `${complete} fully through the journey, ${total - complete} still in progress.`,
          "",
          ...perStation,
          referrals ? `\n⚠ ${plural(referrals, "referral")} flagged.` : "",
          loaded.length < total ? `\n(${total - loaded.length} still loading.)` : "",
        ]
          .filter((l) => l !== "")
          .join("\n"),
        chips: ["Who's waiting for consult?", "Any referrals today?"],
      };
    },
  },
  {
    id: "longest_wait",
    keywords: ["longest", "waiting longest", "stuck", "slowest", "oldest", "been here"],
    handler: ({ ctx }) => {
      const stuck = ctx.patients
        .filter((p) => ctx.statuses[p.visit_id] && ctx.statuses[p.visit_id].nextStation !== null)
        .sort(byQueueNumber);
      if (!stuck.length) {
        return { pose: "cheer", text: "Nobody is stuck — everyone registered has finished their journey." };
      }
      return {
        pose: "alert",
        text: `Earliest in the queue still waiting — start here:`,
        cards: stuck.slice(0, 5).map((p) => toCard(p, ctx)),
      };
    },
  },
  {
    id: "list_all",
    keywords: ["list", "everyone", "all patients", "show me", "who is here", "who's here", "queue"],
    handler: ({ ctx }) => {
      if (!ctx.patients.length) {
        return { pose: "sleeping", text: "The queue is empty today." };
      }
      const sorted = [...ctx.patients].sort(byQueueNumber);
      return {
        pose: "talking",
        text: `Today's queue — ${plural(sorted.length, "patient")}:`,
        cards: sorted.slice(0, 20).map((p) => toCard(p, ctx)),
      };
    },
  },
];

/* ------------------------------------------------------------------ *
 * Dispatch
 * ------------------------------------------------------------------ */

export function respond(raw: string, ctx: ChatContext): BotReply {
  const text = normalise(raw);
  if (!text) {
    return { pose: "thinking", text: "Ask me anything about today's queue.", chips: HELP_CHIPS };
  }

  const station = findStation(text);
  const matches = resolvePatients(raw, text, ctx);

  let winner: { intent: Intent; score: number } | null = null;
  for (const intent of INTENTS) {
    let score = 0;
    for (const kw of intent.keywords) {
      if (text.includes(kw)) score += kw.includes(" ") ? 3 : 2;
    }
    if (score === 0) continue;
    if (intent.needsPatient && matches.length) score += 3;
    if (intent.needsStation && station) score += 3;
    if (!winner || score > winner.score) winner = { intent, score };
  }

  if (winner) return winner.intent.handler({ raw, text, ctx, station, matches });

  // No keyword hit, but the message clearly points at someone or somewhere —
  // treat a bare "12A" or a bare "consult" as the obvious question.
  if (matches.length) {
    return INTENTS.find((i) => i.id === "patient_status")!.handler({ raw, text, ctx, station, matches });
  }
  if (station) {
    return INTENTS.find((i) => i.id === "station_waiting")!.handler({ raw, text, ctx, station, matches });
  }

  return {
    pose: "thinking",
    text:
      "I didn't catch that one. I can look up a patient by queue number or name, tell you who's waiting at a station, or summarise the session.",
    chips: HELP_CHIPS,
  };
}

export { HELP_CHIPS };
