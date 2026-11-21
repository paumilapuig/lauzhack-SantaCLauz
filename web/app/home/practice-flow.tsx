"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { WordToPractice } from "@/lib/student-contract";
import { DISTRACTORS, savePractice } from "./data";
import { blankPhrase, heardMatches, optionsFor } from "./practice-logic";
import { OptionsStep, StepCard } from "./practice-step";
import { listenOnce, speak } from "./speech";

const STEPS = ["Escucha y elige", "Completa la frase", "Dilo en voz alta"];
const MAX_LEVEL = 2;

export function PracticeFlow({ word, onDone }: { word: WordToPractice; onDone: (lemma: string) => void }) {
  const [step, setStep] = useState(0);
  const [retry, setRetry] = useState(false);
  const [heardMessage, setHeardMessage] = useState<string | null>(null);
  const [level, setLevel] = useState<number | null>(null);

  const options = optionsFor(word.lemma, DISTRACTORS);
  const blank = blankPhrase(word.key_phrase, word.lemma);

  function pick(option: string) {
    const right = option === word.lemma;
    setRetry(!right);
    if (right) setStep(step + 1);
  }

  async function speakAnswer() {
    const heard = await listenOnce("fr-FR");
    setHeardMessage(heard && heardMatches(heard, word.lemma) ? "¡Muy bien!" : "No te hemos oído bien, lo damos por hecho.");
    const result = await savePractice({ lemma: word.lemma, clip_id: word.clip_id, passed: true });
    setLevel(result.level);
  }

  const outcome =
    level === null
      ? null
      : level >= MAX_LEVEL
        ? `Ya no necesitas ayuda para ${word.lemma}`
        : `${word.lemma} sube de nivel`;

  return (
    <div className="flex flex-col gap-3">
      <StepCard number={1} title={STEPS[0]} active={step === 0}>
        <OptionsStep
          prompt={
            <Button variant="secondary" className="min-h-11" onClick={() => speak(word.key_phrase, 0.8)}>
              Escuchar
            </Button>
          }
          options={options}
          retry={retry}
          onPick={pick}
        />
      </StepCard>
      <StepCard number={2} title={STEPS[1]} active={step === 1}>
        <OptionsStep
          prompt={
            <p lang="fr">
              {blank.before}____{blank.after}
            </p>
          }
          options={options}
          retry={retry}
          onPick={pick}
        />
      </StepCard>
      <StepCard number={3} title={STEPS[2]} active={step === 2}>
        {heardMessage ? (
          <>
            <p role="status">{heardMessage}</p>
            {outcome && <p>{outcome}</p>}
            {outcome && <Button className="min-h-11" onClick={() => onDone(word.lemma)}>Volver</Button>}
          </>
        ) : (
          <Button className="min-h-11" onClick={speakAnswer}>
            Dilo en voz alta
          </Button>
        )}
      </StepCard>
    </div>
  );
}
