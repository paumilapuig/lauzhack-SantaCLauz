"use client";

import { Mic } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { WordToPractice } from "@/lib/student-contract";
import { DISTRACTORS, savePractice } from "./data";
import { blankPhrase, heardMatches, optionsFor } from "./practice-logic";
import { OptionsStep, StepCard } from "./practice-step";
import { listenOnce, speak } from "./speech";

const STEPS = ["Escucha y elige", "Completa la frase", "Dilo en voz alta"];
const MAX_LEVEL = 2;

type Props = { word: WordToPractice; onDone: (lemma: string) => void; onExit: () => void };

export function PracticeFlow({ word, onDone, onExit }: Props) {
  const [step, setStep] = useState(0);
  const [retry, setRetry] = useState(false);
  const [heardMessage, setHeardMessage] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [level, setLevel] = useState<number | null>(null);

  const options = optionsFor(word.lemma, DISTRACTORS);
  const blank = blankPhrase(word.key_phrase, word.lemma);
  const blankOptions = options.map((o) => (o === word.lemma ? blank.answerForm : o)).sort((a, b) => a.localeCompare(b, "fr"));

  function pick(option: string) {
    const right = option === word.lemma || option === blank.answerForm;
    setRetry(!right);
    if (right) setStep(step + 1);
  }

  async function speakAnswer() {
    setListening(true);
    const heard = await listenOnce("fr-FR");
    setListening(false);
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
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Practicamos</p>
          <h2 lang="fr" className="text-2xl font-bold">{word.lemma}</h2>
          <p>{word.translation_es}</p>
        </div>
        <Button variant="ghost" onClick={onExit}>Salir</Button>
      </header>
      <StepCard number={1} title={STEPS[0]} active={step === 0} done={step > 0}>
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
      <StepCard number={2} title={STEPS[1]} active={step === 1} done={step > 1}>
        <OptionsStep
          prompt={
            <p lang="fr">
              {blank.before}____{blank.after}
            </p>
          }
          options={blankOptions}
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
          <>
            <p lang="fr" className="text-3xl font-bold">{word.lemma}</p>
            <p>Pulsa el botón y di la palabra.</p>
            <Button disabled={listening} className="disabled:opacity-100" onClick={speakAnswer}>
              <Mic aria-hidden />
              <span aria-live="polite">{listening ? "Te escucho…" : "Hablar"}</span>
            </Button>
          </>
        )}
      </StepCard>
    </div>
  );
}
