# Spike C: live French subtitles

Browser-only spike of the Web Speech subtitles with fading word help.

## Run
1. `npm install`
2. `npm run dev` and open http://localhost:5173
3. `npm test` runs unit tests, `npm run typecheck` checks types.

## Notes
- Chrome or Edge only (Web Speech API; Firefox and Safari are not supported).
- Click Start and allow microphone permission when asked.
- Press Space while speaking to mark the start of an utterance for latency.
- Use the "Simulate transcript" box to feed text without a microphone.
