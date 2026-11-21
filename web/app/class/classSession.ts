interface Stoppable {
  start(): void;
  stop(): void;
}

export interface SessionSteps<T> {
  openStream(): Promise<MediaStream>;
  openSession(): Promise<string | undefined>;
  assemble(stream: MediaStream, sessionId: string): { recorder: Stoppable; recognizer: Stoppable; value: T };
}

export type StartResult<T> =
  | { status: "started"; value: T }
  | { status: "stream-failed" }
  | { status: "session-failed" }
  | { status: "cancelled" };

function releaseStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop());
}

/** Owns the mic stream, recorder and recognizer; guarantees they are all stopped on stop/dispose/restart. */
export function createClassSession() {
  let generation = 0;
  let disposed = false;
  let stopCurrent = () => {};

  function stop() {
    const stopNow = stopCurrent;
    stopCurrent = () => {};
    stopNow();
  }

  async function start<T>(steps: SessionSteps<T>): Promise<StartResult<T>> {
    stop();
    const mine = ++generation;
    const isStale = () => disposed || mine !== generation;

    let stream: MediaStream;
    try {
      stream = await steps.openStream();
    } catch {
      return isStale() ? { status: "cancelled" } : { status: "stream-failed" };
    }
    if (isStale()) {
      releaseStream(stream);
      return { status: "cancelled" };
    }
    const sessionId = await steps.openSession().catch(() => undefined);
    if (isStale()) {
      releaseStream(stream);
      return { status: "cancelled" };
    }
    if (!sessionId) {
      releaseStream(stream);
      return { status: "session-failed" };
    }

    const { recorder, recognizer, value } = steps.assemble(stream, sessionId);
    stopCurrent = () => {
      recognizer.stop();
      recorder.stop();
      releaseStream(stream);
    };
    recorder.start();
    recognizer.start();
    return { status: "started", value };
  }

  function dispose() {
    disposed = true;
    stop();
  }

  return { start, stop, dispose };
}

export type ClassSession = ReturnType<typeof createClassSession>;
