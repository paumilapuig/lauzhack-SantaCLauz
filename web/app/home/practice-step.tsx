import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function StepCard({
  number,
  title,
  active,
  done = false,
  children,
}: {
  number: number;
  title: string;
  active: boolean;
  done?: boolean;
  children?: ReactNode;
}) {
  return (
    <Card className={active ? "border-2 border-primary px-4" : "px-4 opacity-70"}>
      <h3 className="flex items-center gap-2 text-lg font-bold">
        {done && (
          <>
            <Check aria-hidden className="size-5 text-primary" />
            <span className="sr-only">completado</span>
          </>
        )}
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
