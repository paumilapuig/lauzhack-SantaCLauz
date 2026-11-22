"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/page-title";
import { StudentShell } from "@/components/student-shell";
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
  const [starting, setStarting] = useState(false);
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
    if (!session || starting) return;
    setStarting(true);
    try {
      await startSession(session);
    } finally {
      setStarting(false);
    }
  }

  async function startSession(session: ClassSession) {
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
      setSubtitles(EMPTY_SUBTITLES);
      setPhase("running");
    } else if (result.status === "stream-failed") {
      fail("No se pudo acceder al micrófono. Permite el acceso en el navegador y vuelve a intentarlo.");
    } else if (result.status === "session-failed") {
      fail("No se pudo iniciar la clase.");
    }
  }

  function press(action: keyof Buttons) {
    return async () => announceResult(toast, action, await buttons?.[action]());
  }

  const running = phase === "running";

  return (
    <StudentShell hideTabbar={running}>
      {running ? (
        <main className="relative mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-[1200px] flex-col gap-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-8 lg:pb-8">
          <h1 className="sr-only">Clase</h1>
          <div className="flex justify-end">
            <SubtitleSwitch checked={showSubtitles} onChange={setShowSubtitles} />
          </div>
          <LiveSubtitles text={lineText(subtitles)} visible={showSubtitles} />
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <ClassActionButton action="unclear" onPress={press("onUnclear")} />
            <ClassActionButton action="lost" onPress={press("onLost")} />
          </div>
        </main>
      ) : (
        <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 pt-8 pb-28 lg:px-8 lg:pt-10">
          <header className="flex flex-col gap-2">
            <PageTitle title="Clase" />
            <p className="max-w-[36em] text-[16px] leading-6 text-label-secondary">
              Subtítulos en directo. Puedes ocultarlos; el micrófono sigue. Pulsa si no entiendes o te pierdes.
            </p>
          </header>
          <div className="flex flex-col items-start gap-4 rounded-[24px] border border-border bg-card p-6 md:p-8">
            <p className="text-[15px] text-muted-foreground">
              Necesitas Chrome y permiso de micrófono. Luego verás los subtítulos y los dos botones grandes.
            </p>
            <Button onClick={start} disabled={starting}>
              {starting ? "Pidiendo micrófono…" : "Empezar clase"}
            </Button>
            {phase === "error" && (
              <p role="alert" className="text-base font-medium text-word-orange">
                {message}
              </p>
            )}
          </div>
        </main>
      )}
    </StudentShell>
  );
}
