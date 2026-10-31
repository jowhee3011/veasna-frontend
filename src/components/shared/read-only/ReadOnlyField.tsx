interface Props {
  label: string;
  value?: string | null;
}

/**
 * A labelled block of recorded text in a reference panel.
 *
 * These panels are read-only, so the value is rendered as text rather than
 * into a disabled <textarea>: a textarea suggests the field is editable, clips
 * long entries to its fixed height, and shows a resize handle that does
 * nothing useful.
 */
export default function ReadOnlyField({ label, value }: Props) {
  const text = value?.trim();
  return (
    <div>
      <p className="eyebrow mb-1">{label}</p>
      <p
        className={`whitespace-pre-wrap rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm leading-relaxed ${
          text ? "text-foreground" : "italic text-muted-foreground"
        }`}
      >
        {text || "Not recorded"}
      </p>
    </div>
  );
}
