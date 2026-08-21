interface StockLevelSelectorProps {
    currentLevel: "low" | "medium" | "high" | "no stock"
    drugId: number
    onStockLevelChange: (drugId: number, newLevel: "low" | "medium" | "high" | "no stock") => void
}

export function StockLevelSelector({ currentLevel, drugId, onStockLevelChange }: StockLevelSelectorProps) {
    return (
      <select
        value={currentLevel}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onStockLevelChange(drugId, e.target.value as "low" | "medium" | "high" | "no stock")}
        className="border border-input px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-blue-500"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="no stock">No Stock</option>
      </select>
    )
}
  