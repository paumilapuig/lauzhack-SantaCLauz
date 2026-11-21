import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function StepCard({
  number,
  title,
  active,
  children,
}: {
  number: number;
  title: string;
  active: boolean;
  children?: ReactNode;
}) {
  return (
    <Card className={active ? "border-2 border-primary px-4" : "px-4 opacity-70"}>
      <h3 className="text-lg font-bold">
        {number}. {title}
      </h3>
      {active && children}
    </Card>
  );
}

export function OptionsStep({
  prompt,
  options,
  retry,
  onPick,
}: {
  prompt: ReactNode;
  options: string[];
  retry: boolean;
  onPick: (option: string) => void;
}) {
  return (
    <>
      <div className="text-lg">{prompt}</div>
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <Button key={option} variant="outline" lang="fr" className="min-h-11 text-lg" onClick={() => onPick(option)}>
            {option}
          </Button>
        ))}
      </div>
      {retry && <p role="status">Casi. Prueba otra vez.</p>}
    </>
  );
}
