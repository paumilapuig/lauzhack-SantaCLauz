"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SubtitleLines } from "./subtitleLines";

/** Live subtitles with a toggle that only hides the text; recognition keeps running underneath. */
export function LiveSubtitles({ lines }: { lines: SubtitleLines }) {
  const [visible, setVisible] = useState(true);

  return (
    <section className="flex flex-col gap-2">
      <Button
        variant="outline"
        className="self-start"
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? "Ocultar subtítulos" : "Mostrar subtítulos"}
      </Button>
      {visible && (
        <div aria-live="polite" className="flex min-h-24 flex-col gap-1 text-lg">
          {lines.finals.map((line, index) => (
            <p key={`${index}-${line}`}>{line}</p>
          ))}
          {lines.interim && <p className="text-muted-foreground">{lines.interim}</p>}
        </div>
      )}
    </section>
  );
}
