"use client";

import PixelMascot from "@/components/mascot/PixelMascot";

interface Props {
  /** Fill the viewport (app boot) rather than sitting inline. */
  fullscreen?: boolean;
  message?: string;
}

export default function LoadingSpinner({ fullscreen = true, message = "Lighting the lantern…" }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullscreen ? "min-h-screen" : "py-10"
      }`}
    >
      <PixelMascot pose="working" size={fullscreen ? 80 : 52} animated energy={1.7} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
