/**
 * Three-column working layout for the Seva, physiotherapy and consultation
 * stations: two read-only reference panels on the left, and the panel the
 * clinician actually types into on the right.
 *
 * The columns are sized here, in one place. The panels themselves must not set
 * their own width — they used to carry `lg:w-[30%]`/`lg:w-[40%]` from an older
 * flex layout, which, once they were placed inside a three-column grid, meant
 * each one rendered at ~30% of a 33% column and every label wrapped.
 */

interface Props {
  /** Patient identity, vitals, history. */
  reference: React.ReactNode;
  /** What triage recorded. */
  triage: React.ReactNode;
  /** The editable notes for this station — gets the remaining width. */
  work: React.ReactNode;
}

export default function StationWorkspace({ reference, triage, work }: Props) {
  return (
    <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-[minmax(0,17rem)_minmax(0,21rem)_minmax(0,1fr)]">
      {reference}
      {triage}
      {/* Below xl the notes sit on their own full-width row rather than being
          squeezed into a half column next to the reference panels. */}
      <div className="md:col-span-2 xl:col-span-1">{work}</div>
    </div>
  );
}
