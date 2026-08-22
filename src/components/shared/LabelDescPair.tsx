interface Props {
  label: string;
  description: string;
}

/**
 * One read-only field in a reference panel.
 *
 * The panels are narrow, so the label and value wrap onto separate lines
 * rather than being squeezed side by side: `flex-wrap` lets the value drop
 * below its label when there isn't room, instead of both halves collapsing to
 * a few characters wide.
 */
export default function LabelDescriptionPair({ label, description }: Props) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-border/60 py-1.5 last:border-b-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right text-sm font-semibold text-foreground">
        {description}
      </dd>
    </div>
  );
}
