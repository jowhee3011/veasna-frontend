// src/components/login/login.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import PixelMascot from "@/components/mascot/PixelMascot";
import { getUsers } from "@/lib/api/user/getUsers";
import { loginUser } from "@/lib/api/user/loginUser";
import { User } from "@/lib/types/user";
import { useUserStore } from "@/stores/useUserStore";

export default function Login() {
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUsers().then((list) => setUsers(Array.isArray(list) ? list : []));
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const matches = useMemo(() => {
    const q = username.trim().toLowerCase();
    const names = users.map((u) => u.username);
    return q ? names.filter((n) => n.toLowerCase().includes(q)) : names;
  }, [users, username]);

  /** Typing a name that isn't on file creates that user on login. */
  const isNewUser =
    username.trim().length > 0 &&
    !users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase());

  const handleLogin = async () => {
    const name = username.trim();
    if (!name) {
      toast.error("Enter or pick a name to sign in");
      return;
    }
    setIsSubmitting(true);
    try {
      const loggedInUser = await loginUser(name);
      setUser(loggedInUser);
      toast.success(`Welcome, ${loggedInUser.username}!`);
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error("Sign in failed — check the connection to the server and try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && matches.length) {
      e.preventDefault();
      setOpen(true);
      setHighlighted((i) => (i < matches.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp" && matches.length) {
      e.preventDefault();
      setHighlighted((i) => (i > 0 ? i - 1 : matches.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && highlighted >= 0 && matches[highlighted]) {
        setUsername(matches[highlighted]);
        setOpen(false);
        setHighlighted(-1);
      } else {
        handleLogin();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-xl)] md:grid-cols-2">
      {/* ---- Brand panel ---- */}
      <div className="relative flex flex-col justify-between gap-8 bg-gradient-to-br from-[var(--primary-soft)] via-card to-card p-8">
        <div className="flex items-center gap-2.5">
          <PixelMascot pose="idle" size={36} energy={1} />
          <span className="text-lg font-bold tracking-tight text-foreground">Veasna</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <PixelMascot pose="happy" size={128} energy={1.2} label="Veasna, the screening assistant" />
          <h2 className="mt-5 text-xl font-bold text-balance text-foreground">
            Lighting the way through every screening
          </h2>
          <p className="mt-2 max-w-[34ch] text-sm text-muted-foreground">
            Registration to pharmacy in one place — and I&apos;ll keep track of where every patient
            has got to.
          </p>
        </div>

        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {["Register patients and issue queue numbers", "Triage, Seva, physiotherapy and consultation", "Live station progress for the whole queue"].map((line) => (
            <li key={line} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      {/* ---- Form panel ---- */}
      <div className="flex flex-col justify-center gap-6 p-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick your name, or type a new one to add yourself to this site.
          </p>
        </div>

        <div ref={wrapRef} className="relative">
          <label htmlFor="login-username" className="eyebrow mb-1.5 block">
            Your name
          </label>
          <input
            id="login-username"
            value={username}
            autoComplete="off"
            onChange={(e) => {
              setUsername(e.target.value);
              setOpen(true);
              setHighlighted(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Select or type a name…"
            role="combobox"
            aria-expanded={open}
            aria-controls="login-user-options"
            className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus:border-[var(--primary)]"
          />

          {open && matches.length > 0 && (
            <ul
              id="login-user-options"
              role="listbox"
              className="scroll-slim absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-[var(--shadow-lg)] animate-pop-in"
            >
              {matches.map((name, i) => (
                <li key={name} role="option" aria-selected={i === highlighted}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlighted(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setUsername(name);
                      setOpen(false);
                      setHighlighted(-1);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                      i === highlighted ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]" : "hover:bg-muted"
                    }`}
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-[11px] font-bold uppercase text-foreground">
                      {name.slice(0, 2)}
                    </span>
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {isNewUser && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--lantern-ink)]">
              <span className="grid h-4 w-4 place-items-center rounded-full bg-[var(--lantern)] text-[10px] font-bold">
                +
              </span>
              &ldquo;{username.trim()}&rdquo; is new — signing in will create this account.
            </p>
          )}
        </div>

        <button
          onClick={handleLogin}
          disabled={isSubmitting || !username.trim()}
          className="flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90 disabled:opacity-40"
        >
          {isSubmitting ? "Signing in…" : "Sign in"}
          {!isSubmitting && (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          )}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Names identify who recorded each entry — there is no password on this system.
        </p>
      </div>
    </div>
  );
}
