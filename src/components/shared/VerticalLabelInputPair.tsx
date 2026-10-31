interface Props {
  label?: string
  bolded?: boolean
  value?: string
  readOnly?: boolean
  /** Visible lines before scrolling; the field is resizable regardless. */
  rows?: number
  onChangeFunction?: (newValue: string) => void
}

export default function VerticalLabelInputPair({
  label,
  bolded = true,
  value = "",
  readOnly = false,
  rows = 4,
  onChangeFunction,
}: Props) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <div>
          <p className={`text-sm ${bolded ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</p>
        </div>
      )}

      <textarea
        className="min-h-24 w-full flex-1 resize-y rounded-xl border border-input bg-background p-3 text-sm leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground focus:border-[var(--primary)]"
        value={value}
        readOnly={readOnly}
        rows={rows}
        onChange={(e) => onChangeFunction?.(e.target.value)}
      />
    </div>
  );
}
