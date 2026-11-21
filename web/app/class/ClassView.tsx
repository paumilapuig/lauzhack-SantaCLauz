"use client";

import { useEffect, useRef, useState } from "react";
import { BigButton } from "@/components/ui/big-button";
import { Button } from "@/components/ui/button";
import { createAudioRingRecorder } from "@/lib/audioRingRecorder";
import { getClassApi, type ClassApi, type MockClassApi, type SavedItem } from "./classApi";
import { createClassButtons, type ButtonResult } from "./classButtons";
import { MockSavedList } from "./MockSavedList";
import { createRecognizer, type SpeechRecognitionCtor } from "./recognizer";
import { createTranscriptBuffer } from "./transcriptBuffer";

const LESSON_ID = "demo-lesson";
const LOST_WINDOW_SEC = 30;
const TRANSCRIPT_KEEP_SEC = 60;

type Phase = "idle" | "running" | "error";
type Buttons = ReturnType<typeof createClassButtons>;

function isMock(api: ClassApi): api is MockClassApi {
  return "list" in api;
}

function findRecognitionCtor(): SpeechRecognitionCtor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function ClassView() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [liveLine, setLiveLine] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);
  const [buttons, setButtons] = useState<Buttons>();
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const apiRef = useRef<ClassApi>(undefined);
  const stopAll = useRef<() => void>(() => {});

  useEffect(() => () => stopAll.current(), []);

  function fail(text: string) {
    setMessage(text);
    setPhase("error");
  }

  async function start() {
    const Ctor = findRecognitionCtor();
    if (!Ctor) return fail("Este navegador no admite reconocimiento de voz. Usa Chrome.");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return fail("No se pudo acceder al micrófono. Permite el acceso y vuelve a intentarlo.");
    }
    const api = (apiRef.current ??= getClassApi());
    const sessionId = await api.startSession(LESSON_ID).catch(() => undefined);
    if (!sessionId) {
      stream.getTracks().forEach((track) => track.stop());
      return fail("No se pudo iniciar la clase.");
    }

    const t0 = performance.now();
    const nowSec = () => (performance.now() - t0) / 1000;
    const transcript = createTranscriptBuffer({ keepSec: TRANSCRIPT_KEEP_SEC });
    const recorder = createAudioRingRecorder({ stream, now: nowSec });
    const recognizer = createRecognizer({
      Ctor,
      now: nowSec,
      onResult({ finalText, interimText, at }) {
        if (finalText.trim()) transcript.add(finalText.trim(), at);
        transcript.prune(at);
        setLiveLine(finalText || interimText);
      },
      onSpeechStart() {},
      onStatus(status, detail) {
        if (status === "error") fail(`Error de reconocimiento de voz (${detail}).`);
      },
    });
    recorder.start();
    recognizer.start();
    stopAll.current = () => {
      recognizer.stop();
      recorder.stop();
      stream.getTracks().forEach((track) => track.stop());
    };
    setButtons(createClassButtons({ api, recorder, transcript, sessionId, nowSec, lostWindowSec: LOST_WINDOW_SEC }));
    setPhase("running");
  }

  function press(action: keyof Buttons) {
    return async () => {
      const result: ButtonResult | undefined = await buttons?.[action]();
      if (result === "failed") setSaveFailed(true);
      else if (result === "saved") setSaveFailed(false);
      if (result === "saved" && apiRef.current && isMock(apiRef.current)) setSaved(apiRef.current.list());
    };
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Clase</h1>
      {phase !== "running" && <Button onClick={start}>Empezar clase</Button>}
      {phase === "error" && <p role="alert">{message}</p>}
      {phase === "running" && (
        <>
          <p aria-live="polite" className="min-h-8 text-lg">
            {liveLine}
          </p>
          <div className="flex gap-4">
            <BigButton variant="unclear" onPress={press("onUnclear")} />
            <BigButton variant="lost" onPress={press("onLost")} />
          </div>
          {saveFailed && <p role="alert">No se ha podido guardar</p>}
        </>
      )}
      <MockSavedList items={saved} />
    </main>
  );
}
