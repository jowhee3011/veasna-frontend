interface StockLevelBadgeProps {
    level: "low" | "medium" | "high" | "no stock"
}

export function StockLevelBadge({ level }: StockLevelBadgeProps) {
    const getStockLevelColor = (level: "low" | "medium" | "high" | "no stock"): string => {
      switch (level) {
        case "low": return "bg-[var(--warning)]"
        case "medium": return "bg-[var(--primary)]"
        case "high": return "bg-[var(--success)]"
        case "no stock": return "bg-[var(--destructive)]"
        default: return "bg-muted-foreground"
      }
    }
  
    return (
      <span className={`inline-flex items-center justify-center h-8 w-24 px-3 py-1 rounded-full text-xs font-medium text-white ${getStockLevelColor(level)}`}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </span>
    )
}