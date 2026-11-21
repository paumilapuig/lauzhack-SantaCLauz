import type { SavedItem } from "./classApi";

function formatRange(tStart: number, tEnd: number): string {
  return `${tStart.toFixed(0)}s – ${tEnd.toFixed(0)}s`;
}

export function MockSavedList({ items }: { items: SavedItem[] }) {
  if (items.length === 0) return null;
  return (
    <ul aria-label="Guardado (modo demo)" className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={index} className="rounded-lg border p-3 text-sm">
          {item.kind === "clip" ? (
            <>
              <p className="font-semibold">Clip</p>
              <audio controls src={item.audioUrl} className="my-2 w-full" />
            </>
          ) : (
            <p className="font-semibold">Momento perdido {formatRange(item.tStart, item.tEnd)}</p>
          )}
          <p className="text-muted-foreground">{item.transcript || "(sin texto)"}</p>
        </li>
      ))}
    </ul>
  );
}
