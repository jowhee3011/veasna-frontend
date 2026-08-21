import PixelMascot from "@/components/mascot/PixelMascot";

export default function NoPatientSelected() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <PixelMascot pose="sleeping" size={72} energy={0.7} />
      <h2 className="text-lg font-bold text-foreground">No patient selected</h2>
      <p className="max-w-[40ch] text-sm text-muted-foreground">
        Search a queue number or name above and I&apos;ll pull up everything recorded so far.
      </p>
    </div>
  );
}
