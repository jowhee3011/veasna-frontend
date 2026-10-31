"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { AddDrugSidebar } from "@/components/pharmacy/AddDrugSidebar";
import { DrugTable } from "@/components/pharmacy/DrugTable";
import { FullSearchBar } from "@/components/patient-list/FullSearchBar";
import MascotCoach from "@/components/mascot/MascotCoach";
import PixelMascot from "@/components/mascot/PixelMascot";
import { addDrug, deleteDrug, getDrugsByLocation, updateDrugStock } from "@/lib/api/pharmacy/pharmacy";
import { Drug } from "@/lib/types/drug";
import { SET_LOCATION_MESSAGE } from "@/messages/info";
import { useLocationStore } from "@/stores/useLocationStore";

type StockLevel = Drug["stock_level"];

const LEVEL_TONE: Record<string, string> = {
  "no stock": "bg-[var(--destructive-soft)] text-[var(--destructive)]",
  low: "bg-[var(--warning-soft)] text-[var(--warning)]",
  medium: "bg-[var(--primary-soft)] text-[var(--primary-strong)]",
  high: "bg-[var(--success-soft)] text-[var(--success)]",
};

export default function Pharmacy() {
  const location = useLocationStore((state) => state.currentLocation);

  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddTab, setShowAddTab] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshDrugs = useCallback(async () => {
    if (!location) return;
    setIsLoading(true);
    try {
      const db = await getDrugsByLocation(location.id);
      setDrugs(Array.isArray(db) ? db : []);
    } finally {
      setIsLoading(false);
    }
  }, [location]);

    useEffect(() => {
      if (!location) {
        toast(SET_LOCATION_MESSAGE);
      }
    }, [location]);

  const filteredDrugs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return drugs;
    return drugs.filter(
      (d) => d.drug_name.toLowerCase().includes(q) || d.stock_level.toLowerCase().includes(q)
    );
  }, [drugs, searchTerm]);

  const counts = useMemo(() => {
    const base: Record<string, number> = { "no stock": 0, low: 0, medium: 0, high: 0 };
    for (const drug of drugs) base[drug.stock_level] = (base[drug.stock_level] ?? 0) + 1;
    return base;
  }, [drugs]);

  const needsAttention = counts["no stock"] + counts.low;

  const handleStockLevelChange = async (drugId: number, newLevel: StockLevel) => {
    try {
      const updated = await updateDrugStock(drugId, newLevel);
      setDrugs((prev) => prev.map((d) => (d.id === drugId ? updated : d)));
      toast.success(`${updated.drug_name} stock updated`);
    } catch {
      toast.error("Failed to update stock level");
    }
  };

  const handleDeleteDrug = async (drugId: number) => {
    if (!window.confirm("Remove this drug from the inventory?")) return;
    try {
      await deleteDrug(drugId);
      setDrugs((prev) => prev.filter((d) => d.id !== drugId));
      toast.success("Drug removed");
    } catch {
      toast.error("Failed to delete drug");
    }
  };

  const handleAddDrug = async (newDrugData: { drug_name: string; stock_level: StockLevel }) => {
    if (!location) {
      toast.error("No location selected");
      return;
    }
    try {
      const newDrug = await addDrug({ ...newDrugData, location_id: location.id });
      setDrugs((prev) => [...prev, newDrug]);
      toast.success(`${newDrug.drug_name} added`);
    } catch {
      toast.error("Failed to add drug");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <PixelMascot pose={needsAttention ? "alert" : "happy"} size={54} />
          <div>
            <p className="eyebrow">Station</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Pharmacy</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {location ? `Drug inventory at ${location.name}.` : "Select a screening site."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["no stock", "low", "medium", "high"] as const).map((level) => (
            <span
              key={level}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize ${LEVEL_TONE[level]}`}
            >
              {level} <span className="ml-1 tabular-nums">{counts[level]}</span>
            </span>
          ))}
          <button
            onClick={() => setShowAddTab((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition hover:opacity-90"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {showAddTab ? "Close" : "Add drug"}
          </button>
        </div>
      </header>

      <MascotCoach
        station="pharmacy"
        situation={!location ? "no-location" : "ready"}
        dismissKey="pharmacy"
        note={
          needsAttention > 0
            ? `${needsAttention} ${needsAttention === 1 ? "drug is" : "drugs are"} low or out of stock — worth flagging to the doctors before the next consult.`
            : undefined
        }
      />

      <FullSearchBar placeholder="Search drugs by name or stock level…" onSearchChange={setSearchTerm} />

      <div className={`grid gap-5 ${showAddTab ? "lg:grid-cols-[1fr_320px]" : ""}`}>
        {isLoading ? (
          <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : (
          <DrugTable
            drugs={filteredDrugs}
            onStockLevelChange={handleStockLevelChange}
            onDeleteDrug={handleDeleteDrug}
          />
        )}

        {showAddTab && (
          <div className="animate-slide-up">
            <AddDrugSidebar onSubmit={handleAddDrug} />
          </div>
        )}
      </div>
    </div>
  );
}
