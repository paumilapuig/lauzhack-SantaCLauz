"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/page-title";
import { StudentShell } from "@/components/student-shell";
import { Button } from "@/components/ui/button";
import { createAudioRingRecorder } from "@/lib/audioRingRecorder";
import { classApiMode, getClassApi, type ClassApi } from "./classApi";
import { createClassSession, type ClassSession } from "./classSession";
import { createClassButtons } from "./classButtons";
import { chooseLessonId } from "./lessonChoice";
import { ClassActionButton } from "./ClassActionButton";
import { LiveSubtitles } from "./LiveSubtitles";
import { DEMO_SCRIPT } from "./demoScript";
import { MicIndicator } from "./MicIndicator";
import { createRecognizer, type RecognizerStatus, type SpeechRecognitionCtor } from "./recognizer";
import { createScriptPlayer } from "./scriptPlayer";
import { SpeechStatusBadge } from "./SpeechStatusBadge";
import { speechStatus } from "./speechStatus";
import { useMicLevel } from "./useMicLevel";
import { useOnline } from "./useOnline";
import { announceResult } from "./savedToast";
import { createSeenWords, type SeenWords } from "./seenWords";
import { SubtitleSwitch } from "./SubtitleSwitch";
import { addResult, EMPTY_SUBTITLES, lineText, type SubtitleLines } from "./subtitleLines";
import { createTranscriptBuffer } from "./transcriptBuffer";

const LOST_WINDOW_SEC = 60;
const PLAN_B_SENTENCE_MS = 4000;
const DEMO_MODE = classApiMode() === "mock";

function DemoModeBadge() {
  return (
    <p className="rounded-full bg-sunbeam px-3 py-1 text-sm font-medium text-charcoal">
      Mode démo · rien n&apos;est enregistré
    </p>
  );
}
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
  const [needsLogin, setNeedsLogin] = useState(false);
  const [starting, setStarting] = useState(false);
  const [subtitles, setSubtitles] = useState<SubtitleLines>(EMPTY_SUBTITLES);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [buttons, setButtons] = useState<Buttons>();
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [recognizerStatus, setRecognizerStatus] = useState<RecognizerStatus>("listening");
  const [planBPlaying, setPlanBPlaying] = useState(false);
  const feedRef = useRef<(text: string) => void>(undefined);
  const playerRef = useRef<ReturnType<typeof createScriptPlayer>>(undefined);
  const micLevel = useMicLevel(micStream);
  const online = useOnline();
  const apiRef = useRef<ClassApi>(undefined);
  const sessionRef = useRef<ClassSession>(undefined);

  useEffect(() => {
    const session = createClassSession();
    sessionRef.current = session;
    return () => session.dispose();
  }, []);

  function stopExtras() {
    playerRef.current?.stop();
    setPlanBPlaying(false);
    setMicStream(null);
  }

  function fail(text: string, loginRequired = false) {
    sessionRef.current?.stop();
    stopExtras();
    setMessage(text);
    setNeedsLogin(loginRequired);
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
    if (!Ctor) return fail("Ce navigateur ne reconnaît pas la voix. Utilise Chrome.");
    const api = (apiRef.current ??= getClassApi());
    if (!(await api.isSignedIn())) return fail("Connecte-toi pour commencer le cours.", true);
    let words: SeenWords | undefined;
    const t0 = performance.now();
    const nowSec = () => (performance.now() - t0) / 1000;

    const result = await session.start({
      openStream: () => navigator.mediaDevices.getUserMedia({ audio: true }),
      async openSession() {
        const lessonId = await chooseLessonId(window.location.search, () => api.latestLessonId());
        words = createSeenWords(await api.classPack(lessonId));
        return api.startSession(lessonId);
      },
      assemble(stream, sessionId) {
        const seen = words!;
        const transcript = createTranscriptBuffer({ keepSec: TRANSCRIPT_KEEP_SEC });
        const recorder = createAudioRingRecorder({ stream, now: nowSec });
        const onResult = ({ finalText, interimText, at }: { finalText: string; interimText: string; at: number }) => {
          if (finalText.trim()) {
            transcript.add(finalText.trim(), at);
            seen.add(finalText);
          }
          transcript.hear(interimText, at);
          transcript.prune(at);
          setSubtitles((lines) => addResult(lines, { finalText, interimText, at }));
        };
        feedRef.current = (text) => onResult({ finalText: text, interimText: "", at: nowSec() });
        setMicStream(stream);
        const recognizer = createRecognizer({
          Ctor,
          now: nowSec,
          onResult,
          onStatus(status, detail) {
            setRecognizerStatus(status);
            if (status === "error") fail(`Erreur de reconnaissance vocale (${detail}).`);
          },
        });
        const value = createClassButtons({ api, recorder, transcript, seen, sessionId, nowSec, lostWindowSec: LOST_WINDOW_SEC });
        return { recorder, recognizer, value };
      },
    });

    if (result.status === "started") {
      setButtons(result.value);
      setSubtitles(EMPTY_SUBTITLES);
      setPhase("running");
    } else if (result.status === "stream-failed") {
      fail("Impossible d'accéder au micro. Autorise-le dans le navigateur et réessaie.");
    } else if (result.status === "session-failed") {
      fail("Impossible de commencer le cours.");
    }
  }

  function press(action: "onUnclear" | "onLost") {
    return async () => announceResult(toast, action, await buttons?.[action]());
  }

  function startPlanB() {
    playerRef.current = createScriptPlayer({
      sentences: DEMO_SCRIPT,
      intervalMs: PLAN_B_SENTENCE_MS,
      onSentence: (sentence) => feedRef.current?.(sentence),
    });
    playerRef.current.start();
    setPlanBPlaying(true);
  }

  async function end() {
    if (!buttons) return;
    sessionRef.current?.stop();
    stopExtras();
    setPhase("idle");
    announceResult(toast, "onEnd", await buttons.onEnd());
  }

  const running = phase === "running";

  return (
    <StudentShell hideTabbar={running}>
      {running ? (
        <main lang="fr" className="relative mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-[1200px] flex-col gap-4 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-8 lg:pb-8">
          <h1 className="sr-only">Cours</h1>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={end}>
                Terminer le cours
              </Button>
              {DEMO_MODE && <DemoModeBadge />}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <SpeechStatusBadge status={speechStatus({ online, recognizer: recognizerStatus })} planBPlaying={planBPlaying} onPlanB={startPlanB} />
              {micLevel && <MicIndicator level={micLevel} />}
              <SubtitleSwitch checked={showSubtitles} onChange={setShowSubtitles} />
            </div>
          </div>
          <LiveSubtitles text={lineText(subtitles)} visible={showSubtitles} />
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
            <ClassActionButton action="unclear" onPress={press("onUnclear")} />
            <ClassActionButton action="lost" onPress={press("onLost")} />
          </div>
        </main>
      ) : (
        <main lang="fr" className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 pt-8 pb-28 lg:px-8 lg:pt-10">
          <header className="flex flex-col gap-2">
            <PageTitle title="Cours" />
            <p className="max-w-[36em] text-[16px] leading-6 text-label-secondary">
              Sous-titres en direct. Tu peux les cacher, le micro continue. Appuie si tu ne comprends pas ou si tu perds le fil.
            </p>
          </header>
          <div className="flex flex-col items-start gap-4 rounded-[24px] border border-border bg-card p-6 md:p-8">
            <p className="text-[15px] text-muted-foreground">
              Il faut Chrome et l&apos;accès au micro. Ensuite tu verras les sous-titres et les deux grands boutons.
            </p>
            {DEMO_MODE && <DemoModeBadge />}
            <Button onClick={start} disabled={starting}>
              {starting ? "Accès au micro…" : "Commencer le cours"}
            </Button>
            {phase === "error" && (
              <p role="alert" className="text-base font-medium text-word-orange">
                {message}
                {needsLogin && (
                  <>
                    {" "}
                    <Link href="/login" className="underline underline-offset-4">
                      Se connecter
                    </Link>
                  </>
                )}
              </p>
            )}
          </div>
        </main>
      )}
    </StudentShell>
  );
}
