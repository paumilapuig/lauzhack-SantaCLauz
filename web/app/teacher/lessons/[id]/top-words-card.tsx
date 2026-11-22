import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopWord } from "../../teacher-contract";

export function TopWordsCard({ words }: { words: TopWord[] }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Mots les plus marqués</CardTitle>
      </CardHeader>
      <CardContent>
        {words.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun mot marqué pour l&apos;instant.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {words.map(({ lemma, taps }) => (
              <li key={lemma} className="flex items-baseline justify-between text-base">
                <span lang="fr" className="font-bold">{lemma}</span>
                <span className="text-sm text-muted-foreground">{taps} fois</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
