"use client";

import Link from "next/link";
import { useUserStore } from "@/stores/useUserStore";

export default function Footer() {
  const username = useUserStore((state) => state.user?.username);

  return (
    <footer className="relative z-[1] mt-8 border-t border-border/70">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Veasna · Built for community health screenings</p>
        <div className="flex items-center gap-4">
          {username && <span>Signed in as <strong className="text-foreground">{username}</strong></span>}
          <span className="hidden sm:inline">
            Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd> to ask Veasna
          </span>
          <Link href="/patient-list" className="font-medium text-[var(--primary-strong)] hover:underline">
            Patient records
          </Link>
        </div>
      </div>
    </footer>
  );
}
