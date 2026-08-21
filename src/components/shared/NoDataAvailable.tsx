import PixelMascot from "@/components/mascot/PixelMascot";

interface Props {
  dataString: string;
}

export default function NoDataAvailable({ dataString }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center">
      <PixelMascot pose="sleeping" size={44} energy={0.7} glow={false} />
      <p className="text-sm font-medium text-foreground">No {dataString} recorded</p>
      <p className="max-w-[34ch] text-xs text-muted-foreground">
        Nothing has been entered for this visit yet — it will appear here once the station saves.
      </p>
    </div>
  );
}
