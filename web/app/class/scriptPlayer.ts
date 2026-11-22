type ScriptPlayerOptions = { sentences: string[]; intervalMs: number; onSentence: (sentence: string) => void };

/** Plan B: plays a prepared lesson as subtitles, one sentence per interval, when speech recognition is offline. */
export function createScriptPlayer({ sentences, intervalMs, onSentence }: ScriptPlayerOptions) {
  let timer: ReturnType<typeof setInterval> | undefined;
  let next = 0;

  function stop() {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
  }

  function playNext() {
    if (next >= sentences.length) return stop();
    onSentence(sentences[next++]);
    if (next >= sentences.length) stop();
  }

  return {
    start() {
      stop();
      next = 0;
      playNext();
      if (next < sentences.length) timer = setInterval(playNext, intervalMs);
    },
    stop,
    playing: () => timer !== undefined,
  };
}
