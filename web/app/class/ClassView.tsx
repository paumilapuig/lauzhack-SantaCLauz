"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createAudioRingRecorder } from "@/lib/audioRingRecorder";
import { getClassApi, type ClassApi } from "./classApi";
import { createClassSession, type ClassSession } from "./classSession";
import { createClassButtons } from "./classButtons";
import { ClassActionButton } from "./ClassActionButton";
import { LiveSubtitles } from "./LiveSubtitles";
import { createRecognizer, type SpeechRecognitionCtor } from "./recognizer";
import { announceResult } from "./savedToast";
import { SubtitleSwitch } from "./SubtitleSwitch";
import { addResult, EMPTY_SUBTITLES, lineText, type SubtitleLines } from "./subtitleLines";
import { createTranscriptBuffer } from "./transcriptBuffer";

const LESSON_ID = "demo-lesson";
const LOST_WINDOW_SEC = 60;
const TRANSCRIPT_KEEP_SEC = 90;

type Phase = "idle" | "running" | "error";
type Buttons = ReturnType<typeof createClassButtons>;

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
  const [subtitles, setSubtitles] = useState<SubtitleLines>(EMPTY_SUBTITLES);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [buttons, setButtons] = useState<Buttons>();
  const apiRef = useRef<ClassApi>(undefined);
  const sessionRef = useRef<ClassSession>(undefined);

  useEffect(() => {
    const session = createClassSession();
    sessionRef.current = session;
    return () => session.dispose();
  }, []);

  function fail(text: string) {
    sessionRef.current?.stop();
    setMessage(text);
    setPhase("error");
  }

  async function start() {
    const session = sessionRef.current;
    if (!session) return;
    const Ctor = findRecognitionCtor();
    if (!Ctor) return fail("Este navegador no admite reconocimiento de voz. Usa Chrome.");
    const api = (apiRef.current ??= getClassApi());
    const t0 = performance.now();
    const nowSec = () => (performance.now() - t0) / 1000;

    const result = await session.start({
      openStream: () => navigator.mediaDevices.getUserMedia({ audio: true }),
      openSession: () => api.startSession(LESSON_ID),
      assemble(stream, sessionId) {
        const transcript = createTranscriptBuffer({ keepSec: TRANSCRIPT_KEEP_SEC });
        const recorder = createAudioRingRecorder({ stream, now: nowSec });
        const recognizer = createRecognizer({
          Ctor,
          now: nowSec,
          onResult({ finalText, interimText, at }) {
            if (finalText.trim()) transcript.add(finalText.trim(), at);
            transcript.prune(at);
            setSubtitles((lines) => addResult(lines, { finalText, interimText, at }));
          },
          onStatus(status, detail) {
            if (status === "error") fail(`Error de reconocimiento de voz (${detail}).`);
          },
        });
        const value = createClassButtons({ api, recorder, transcript, sessionId, nowSec, lostWindowSec: LOST_WINDOW_SEC });
        return { recorder, recognizer, value };
      },
    });

    if (result.status === "started") {
      setButtons(result.value);
      setPhase("running");
    } else if (result.status === "stream-failed") {
      fail("No se pudo acceder al micrófono. Permite el acceso y vuelve a intentarlo.");
    } else if (result.status === "session-failed") {
      fail("No se pudo iniciar la clase.");
    }
  }

  function press(action: keyof Buttons) {
    return async () => announceResult(toast, action, await buttons?.[action]());
  }

  return (
    <main className="relative flex h-dvh flex-col gap-4 p-4 md:p-6">
      <h1 className="sr-only">Clase</h1>
      <div className="absolute top-3 right-3 md:top-4 md:right-4">
        <SubtitleSwitch checked={showSubtitles} onChange={setShowSubtitles} />
      </div>
      {phase !== "running" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Button size="lg" onClick={start}>
            Empezar clase
          </Button>
          {phase === "error" && <p role="alert">{message}</p>}
        </div>
      )}
      {phase === "running" && (
        <>
          <div className="mt-10">
            <LiveSubtitles text={lineText(subtitles)} visible={showSubtitles} />
          </div>
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <ClassActionButton action="unclear" onPress={press("onUnclear")} />
            <ClassActionButton action="lost" onPress={press("onLost")} />
          </div>
        </>
      )}
    </main>
  );
}
