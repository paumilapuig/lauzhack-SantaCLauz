"use client";

import { Check, Mic, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DISTRACTORS } from "./distractors";
import { getHomeApi } from "./getHomeApi";
import { blankPhrase, heardMatches, optionsFor } from "./practice-logic";
import { OptionsStep, StepPanel, StepRail } from "./practice-step";
import { listenOnce, speak } from "./speech";

const STEPS = ["Listen and choose", "Complete the sentence", "Say it out loud"];
const HINTS = ["Listen to the sentence and choose the word you hear", "Choose the missing word", "Press the button and say the word."];
const NO_HELP_LEVEL = 2;
const ROUND = "flex items-center justify-center rounded-full bg-primary text-primary-foreground";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const PILL = `inline-flex h-11 touch-manipulation items-center justify-center rounded-full px-6 text-[17px] font-semibold transition-[background-color,opacity] ${FOCUS}`;

type Props = { word: { lemma: string; glossary_lemma?: string | null; translation_es: string; key_phrase: string; clip_id: string | null }; onDone: (lemma: string) => void; onExit: () => void };

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
  const blankOptions = options.map((o) => (o === word.lemma ? blank.answerForm : o)).sort((a, b) => a.localeCompare(b, "fr"));

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
    const message = heard && heardMatches(heard, word.lemma) ? "Well done!" : "We didn't hear you well, we'll count it.";
    if (word.glossary_lemma === null) {
      setHeardMessage(message); // outside the glossary: nothing to level up on the server
      return;
    }
    try {
      const result = await getHomeApi().practice({ lemma: word.glossary_lemma ?? word.lemma, clip_id: word.clip_id, passed: true });
      if (!mounted.current) return;
      setHeardMessage(message);
      setLevel(result.level);
    } catch {
      if (mounted.current) setSaveFailed(true);
    }
  }

  const outcome =
    level === null ? null : level >= NO_HELP_LEVEL ? `You no longer need help with ${word.lemma}` : `${word.lemma} levels up`;

  return (
    <div className="flex flex-col gap-10 py-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[15px] text-label-secondary">Practising</p>
          <h2 lang="fr" className="text-[40px] leading-tight font-semibold tracking-[-0.025em]">{word.lemma}</h2>
          <p lang="es" className="text-[19px] text-word-yellow">{word.translation_es}</p>
        </div>
        <button type="button" onClick={exit} className={`${PILL} -mr-3 px-3 text-primary hover:opacity-70`}>
          Exit
        </button>
      </header>

      <StepRail steps={STEPS} current={heardMessage ? STEPS.length : step} />

      <StepPanel number={step + 1} title={STEPS[step]} hint={step === 2 && heardMessage ? "Card finished" : HINTS[step]}>
        {step === 0 && (
          <OptionsStep
            prompt={
              <button type="button" onClick={() => speak(word.key_phrase, 0.8)} className={`${PILL} w-fit gap-2 bg-fill text-primary hover:bg-fill-strong`}>
                <Volume2 aria-hidden className="size-5" />
                Listen
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
              <p lang="fr" className="max-w-[30em] text-[24px] leading-relaxed tracking-[-0.01em]">
                {blank.before}
                <span className="mx-1 font-semibold text-word-yellow">____</span>
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
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className={`size-14 ${ROUND}`}>
                <Check aria-hidden className="size-7" strokeWidth={2.5} />
              </span>
              <p role="status" className="text-[17px] text-label-secondary">{heardMessage}</p>
              {outcome && <p lang="fr" className="text-[28px] font-semibold tracking-[-0.02em]">{outcome}</p>}
              {(outcome || word.glossary_lemma === null) && (
                <button type="button" onClick={() => onDone(word.lemma)} className={`${PILL} mt-4 bg-primary text-primary-foreground hover:opacity-90`}>
                  Back
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8 py-6 text-center">
              <p lang="fr" className="text-[56px] leading-none font-semibold tracking-[-0.03em]">{word.lemma}</p>
              {saveFailed && <p role="status" className="text-[17px] text-word-orange">Could not save. Please try again.</p>}
              <button type="button" disabled={listening} onClick={speakAnswer} className={`group flex flex-col items-center gap-3 rounded-3xl p-2 text-[17px] font-semibold ${FOCUS}`}>
                <span className={`relative size-20 transition-[transform,opacity] group-hover:opacity-90 group-active:scale-95 ${ROUND}`}>
                  {listening && <span aria-hidden className="absolute inset-0 rounded-full bg-primary/30 motion-safe:animate-ping" />}
                  <Mic aria-hidden className="relative size-8" />
                </span>
                <span aria-live="polite">{listening ? "Listening…" : "Speak"}</span>
              </button>
            </div>
          ))}
      </StepPanel>
    </div>
  );
}
