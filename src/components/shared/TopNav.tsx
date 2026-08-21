'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import LocationDropdown from "./LocationDropdown";
import PixelMascot from "@/components/mascot/PixelMascot";
import { useLocationStore } from "@/stores/useLocationStore";
import { useLocationDataStore } from "@/stores/useLocationDataStore";
import { getLocations } from "@/lib/api/location";
import { useUserStore } from "@/stores/useUserStore";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/patient-list", label: "Patients" },
  { href: "/triage", label: "Triage" },
  { href: "/seva", label: "Seva" },
  { href: "/physiotherapy", label: "Physio" },
  { href: "/doctors-consultation", label: "Consult" },
  { href: "/pharmacy", label: "Pharmacy" },
];

export default function TopNav() {
  const setLocations = useLocationStore((state) => state.setLocations);
  const fetchData = useLocationDataStore((state) => state.fetchData);
  const removeUser = useUserStore((state) => state.removeUser);
  const username = useUserStore((state) => state.user?.username);
  const router = useRouter();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    (async () => {
      const locations = await getLocations();
      if (locations) setLocations(locations);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-[var(--color-blue-default)] text-white shadow-[var(--shadow-md)]">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-5">
        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5" title="Veasna — home">
          <PixelMascot pose="idle" size={34} energy={1} label="Veasna mascot" />
          <span className="hidden text-lg font-bold tracking-tight sm:block">
            Veasna
          </span>
        </Link>

        {/* Links */}
        <div className="scroll-slim flex flex-1 items-center gap-1 overflow-x-auto">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
                  active ? "text-white" : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
                {/* Lantern-coloured underline marks the current station */}
                <span
                  className={`absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-[var(--lantern)] transition-transform duration-300 ${
                    active ? "scale-x-100" : "scale-x-0"
                  }`}
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh data"
            aria-label="Refresh data"
            className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={isRefreshing ? "animate-spin" : ""}>
              <path d="M21 12a9 9 0 1 1-2.6-6.4" />
              <path d="M21 3v6h-6" />
            </svg>
          </button>

          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              title="Toggle theme"
              aria-label="Toggle colour theme"
              className="rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {resolvedTheme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                </svg>
              )}
            </button>
          )}

          <div className="mx-1 h-6 w-px bg-white/20" aria-hidden />

          <LocationDropdown />

          <div className="mx-1 hidden h-6 w-px bg-white/20 sm:block" aria-hidden />

          <button
            onClick={() => {
              removeUser();
              router.push("/login");
            }}
            title={username ? `Signed in as ${username} — sign out` : "Sign out"}
            aria-label="Sign out"
            className="hidden items-center gap-2 rounded-lg py-1.5 pl-2 pr-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white sm:flex"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-xs font-bold uppercase">
              {username?.slice(0, 2) ?? "??"}
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 17l5-5-5-5M20 12H9M11 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
