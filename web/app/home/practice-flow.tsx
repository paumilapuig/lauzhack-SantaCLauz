"use client";

import { Check, Mic, Volume2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HAND, Highlight } from "@/components/notebook";
import { Button } from "@/components/ui/button";
import type { WordToPractice } from "@/lib/student-contract";
import { DISTRACTORS, savePractice } from "./data";
import { blankPhrase, heardMatches, optionsFor } from "./practice-logic";
import { OptionsStep, StepPanel, StepRail } from "./practice-step";
import { listenOnce, speak } from "./speech";
import { RULED } from "./word-card";

const STEPS = ["Escucha y elige", "Completa la frase", "Dilo en voz alta"];
const HINTS = [
  "Escucha la frase y elige la palabra que oyes",
  "Elige la palabra que falta",
  "Pulsa el botón y di la palabra.",
];
const NO_HELP_LEVEL = 2;
const ROUND =
  "flex items-center justify-center rounded-full bg-primary text-primary-foreground";

type Props = {
  word: WordToPractice;
  onDone: (lemma: string) => void;
  onExit: () => void;
};

export function PracticeFlow({ word, onDone, onExit }: Props) {
  const [step, setStep] = useState(0);
  const [retry, setRetry] = useState(false);
  const [heardMessage, setHeardMessage] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [level, setLevel] = useState<number | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const mounted = useRef(true);
  const stopListening = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      mounted.current = false;
      stopListening.current?.();
      globalThis.speechSynthesis?.cancel();
    },
    [],
  );

  function exit() {
    stopListening.current?.();
    globalThis.speechSynthesis?.cancel();
    onExit();
  }

  const options = optionsFor(word.lemma, DISTRACTORS);
  const blank = blankPhrase(word.key_phrase, word.lemma);
  const blankOptions = options
    .map((o) => (o === word.lemma ? blank.answerForm : o))
    .sort((a, b) => a.localeCompare(b, "fr"));

  function pick(option: string) {
    const right = option === word.lemma || option === blank.answerForm;
    setRetry(!right);
    if (right) setStep(step + 1);
  }

  async function speakAnswer() {
    setListening(true);
    setSaveFailed(false);
    const listening = listenOnce("fr-FR");
    stopListening.current = listening.abort;
    const heard = await listening.result;
    if (!mounted.current) return;
    setListening(false);
    try {
      const result = await savePractice({
        lemma: word.lemma,
        clip_id: word.clip_id,
        passed: true,
      });
      if (!mounted.current) return;
      setHeardMessage(
        heard && heardMatches(heard, word.lemma)
          ? "¡Muy bien!"
          : "No te hemos oído bien, lo damos por hecho.",
      );
      setLevel(result.level);
    } catch {
      if (mounted.current) setSaveFailed(true);
    }
  }

  const outcome =
    level === null
      ? null
      : level >= NO_HELP_LEVEL
        ? `Ya no necesitas ayuda para ${word.lemma}`
        : `${word.lemma} sube de nivel`;

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_2px_rgba(27,31,36,0.06),0_16px_40px_-24px_rgba(27,31,36,0.35)]">
      <header
        className={`relative flex items-start justify-between gap-4 pt-8 pr-6 pb-8 pl-14 md:pr-8 ${RULED}`}
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-10 w-px bg-word-orange/40"
        />
        <div className="flex flex-col">
          <p className="leading-8 text-muted-foreground">Practicamos</p>
          <h2 lang="fr" className="text-[40px] leading-[64px] font-bold">
            <Highlight>{word.lemma}</Highlight>
          </h2>
          <p lang="es" className={`text-2xl leading-8 text-lost ${HAND}`}>
            {word.translation_es}
          </p>
        </div>
        <Button variant="ghost" onClick={exit}>
          <X aria-hidden /> Salir
        </Button>
      </header>

      <div className="flex flex-col gap-8 border-t border-border bg-background/60 p-6 md:p-10">
        <StepRail steps={STEPS} current={heardMessage ? STEPS.length : step} />

        <StepPanel
          number={step + 1}
          title={STEPS[step]}
          hint={step === 2 && heardMessage ? "Ficha terminada" : HINTS[step]}
        >
          {step === 0 && (
            <OptionsStep
              prompt={
                <button
                  type="button"
                  onClick={() => speak(word.key_phrase, 0.8)}
                  className="inline-flex h-14 w-fit items-center gap-3 rounded-full bg-foreground pr-6 pl-2 text-lg font-bold text-background transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span className={`size-10 ${ROUND}`}>
                    <Volume2 aria-hidden className="size-5" />
                  </span>
                  Escuchar
                </button>
              }
              options={options}
              retry={retry}
              onPick={pick}
            />
          )}
          {step === 1 && (
            <OptionsStep
              prompt={
                <p
                  lang="fr"
                  className="rounded-2xl bg-card p-6 text-2xl leading-relaxed shadow-[inset_0_0_0_1px_var(--border)]"
                >
                  {blank.before}
                  <span className="mx-1 rounded-md bg-marker/50 px-2 font-bold text-word-yellow">
                    ____
                  </span>
                  {blank.after}
                </p>
              }
              options={blankOptions}
              retry={retry}
              onPick={pick}
            />
          )}
          {step === 2 &&
            (heardMessage ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <span className={`size-16 ${ROUND}`}>
                  <Check aria-hidden className="size-8" />
                </span>
                <p role="status" className="text-lg text-muted-foreground">
                  {heardMessage}
                </p>
                {outcome && (
                  <p lang="fr" className="text-3xl font-bold">
                    <Highlight>{outcome}</Highlight>
                  </p>
                )}
                {outcome && (
                  <Button className="mt-2" onClick={() => onDone(word.lemma)}>
                    Volver
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 py-4 text-center">
                <p lang="fr" className="text-5xl font-bold">
                  <Highlight>{word.lemma}</Highlight>
                </p>
                {saveFailed && (
                  <p role="status" className="text-lg">
                    No se ha podido guardar. Inténtalo otra vez.
                  </p>
                )}
                <button
                  type="button"
                  disabled={listening}
                  onClick={speakAnswer}
                  className="group flex flex-col items-center gap-3 rounded-3xl p-2 text-lg font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span
                    className={`relative size-24 transition-transform group-active:scale-[0.97] ${ROUND}`}
                  >
                    {listening && (
                      <span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-primary/40 motion-safe:animate-ping"
                      />
                    )}
                    <Mic aria-hidden className="relative size-10" />
                  </span>
                  <span aria-live="polite">
                    {listening ? "Te escucho…" : "Hablar"}
                  </span>
                </button>
              </div>
            ))}
        </StepPanel>
      </div>
    </article>
  );
}
