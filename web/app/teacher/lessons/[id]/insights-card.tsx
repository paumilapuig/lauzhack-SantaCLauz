import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InsightsCard({ sentences }: { sentences: string[] }) {
  if (sentences.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">À retenir</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-base">
          {sentences.map((sentence) => (
            <li key={sentence}>{sentence}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
