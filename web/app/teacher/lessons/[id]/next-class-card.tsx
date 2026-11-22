import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConceptGapRow, LostPeak } from "../../teacher-contract";
import { ConceptGapsSection } from "./concept-gaps-section";
import { LostPeaksSection } from "./lost-peaks-section";

interface NextClassCardProps {
  lostPeaks: LostPeak[];
  conceptGaps: ConceptGapRow[];
}

export function NextClassCard({ lostPeaks, conceptGaps }: NextClassCardProps) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Pour la prochaine classe</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <LostPeaksSection peaks={lostPeaks} />
        <ConceptGapsSection gaps={conceptGaps} />
      </CardContent>
    </Card>
  );
}
