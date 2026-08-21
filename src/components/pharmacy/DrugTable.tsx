import { DrugIcon } from "@/assets/icons"
import { Drug } from "@/lib/types/drug"
import { DrugTableRow } from "./DrugTableRow"
import { useMemo } from "react"

interface DrugTableProps {
    drugs: Drug[]
    onStockLevelChange: (drugId: number, newLevel: "low" | "medium" | "high" | "no stock") => void
    onDeleteDrug: (drugId: number) => void
}


export function DrugTable({ drugs, onStockLevelChange, onDeleteDrug}: DrugTableProps) {

    const stockCounts = useMemo(() => {
        return drugs.reduce((acc, drug) => {
          acc[drug.stock_level] = (acc[drug.stock_level] || 0) + 1
          return acc
        }, {} as Record<"low" | "medium" | "high" | "no stock", number>)
      }, [drugs])

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-[var(--primary-soft)] to-transparent">
            <div className="flex items-center justify-between ">
            
              {/* Table Header */}
              <h2 className="text-xl font-bold text-foreground">
                Drug Inventory
              </h2>

              {/* Overal Inventory Statistics */}
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-muted-foreground">
                  Total: <span className="font-semibold">{drugs.length}</span>
                </span>
                <span className="text-[var(--destructive)]">
                  No Stock: <span className="font-semibold">{stockCounts["no stock"] || 0}</span>
                </span>
                <span className="text-[var(--warning)]">
                  Low: <span className="font-semibold">{stockCounts.low || 0}</span>
                </span>
                <span className="text-[var(--primary)]">
                  Medium: <span className="font-semibold">{stockCounts.medium || 0}</span>
                </span>
                <span className="text-[var(--success)]">
                  High: <span className="font-semibold">{stockCounts.high || 0}</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead className="bg-muted">
                <tr>
                  <th className="w-1/4 px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Drug Name
                  </th>
                  <th className="w-1/4 px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Stock Level
                  </th>
                  <th className="w-1/4 px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {drugs.map((drug) => (
                  <DrugTableRow 
                    key={drug.id}
                    drug={drug}
                    onStockLevelChange={onStockLevelChange}
                    onDeleteDrug={onDeleteDrug}
                  />
                ))}
              </tbody>
            </table>
            
            {drugs.length === 0 && (
              <div className="text-center py-12">
                <DrugIcon className="mx-auto h-16 w-16 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium text-foreground">No drugs found</h3>
                <p className="mt-2 text-muted-foreground">
                  Try adjusting your search criteria or check your spelling.
                </p>
              </div>
            )}
          </div>
        </div>
      )
  }