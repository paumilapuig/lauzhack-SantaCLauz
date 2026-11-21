import "./style.css";
import glossary from "../../../docs/demo/glossary-respiration.json";
import { fakeMastery } from "./fakeMastery";
import { createDetectionCounter, createLatencyTracker } from "./metrics";
import {
  createRecognizer,
  type RecognizerStatus,
  type SpeechRecognitionCtor,
} from "./recognizer";
import { renderSegments } from "./render";
import { matchTranscript, segment, type LessonTermInput } from "./wordState";

const MAX_FINAL_LINES = 3;
const terms: LessonTermInput[] = glossary;

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const toggleButton = byId<HTMLButtonElement>("toggle");
const statusPill = byId("status");
const counterEl = byId("counter");
const banner = byId("banner");
const subtitlesEl = byId("subtitles");
const firstMsEl = byId("first-ms");
const finalMsEl = byId("final-ms");
const medianMsEl = byId("median-ms");
const lemmasEl = byId("lemmas");
const simulateInput = byId<HTMLInputElement>("simulate");

const latency = createLatencyTracker();
const counter = createDetectionCounter(terms.map((t) => t.lemma));
const finalLines: string[] = [];
let interimLine = "";

const formatMs = (ms: number | null) => (ms === null ? "–" : `${Math.round(ms)} ms`);
const lineHtml = (text: string, cls: string) =>
  `<p class="${cls}">${renderSegments(segment(text, terms, fakeMastery))}</p>`;

function renderSubtitles(): void {
  const finals = finalLines.map((line) => lineHtml(line, "line"));
  const interim = interimLine ? [lineHtml(interimLine, "line line--interim")] : [];
  subtitlesEl.innerHTML = [...finals, ...interim].join("");
}

function renderLemmas(): void {
  const detected = counter.detected();
  lemmasEl.innerHTML = terms
    .map((t) => `<li${detected.has(t.lemma) ? ' class="seen"' : ""}>${detected.has(t.lemma) ? "✓ " : ""}${t.lemma}</li>`)
    .join("");
  counterEl.textContent = counter.label();
}

function renderLatency(firstTextMs: number | null, finalMs: number | null): void {
  if (firstTextMs !== null) firstMsEl.textContent = formatMs(firstTextMs);
  if (finalMs !== null) finalMsEl.textContent = formatMs(finalMs);
  medianMsEl.textContent = formatMs(latency.medianFirstTextMs());
}

function handleResult(r: { finalText: string; interimText: string; at: number }): void {
  const text = r.finalText || r.interimText;
  if (!text.trim()) return;
  const isFinal = r.finalText !== "";
  counter.add(matchTranscript(text, terms).map((m) => m.lemma));
  const { firstTextMs, finalMs } = latency.markResult(r.at, isFinal);
  if (isFinal) {
    finalLines.push(r.finalText.trim());
    if (finalLines.length > MAX_FINAL_LINES) finalLines.shift();
  }
  interimLine = isFinal ? "" : r.interimText;
  renderSubtitles();
  renderLemmas();
  renderLatency(firstTextMs, finalMs);
}

function setStatus(status: RecognizerStatus, detail?: string): void {
  statusPill.textContent = detail ? `${status}: ${detail}` : status;
  statusPill.dataset.status = status;
  toggleButton.textContent = status === "listening" || status === "restarting" ? "Stop" : "Start";
}

const speechWindow = window as unknown as {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};
const Ctor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

if (Ctor) {
  const recognizer = createRecognizer({
    Ctor,
    onResult: handleResult,
    onSpeechStart: (at) => latency.markSpeechStart(at),
    onStatus: setStatus,
  });
  toggleButton.addEventListener("click", () =>
    toggleButton.textContent === "Start" ? recognizer.start() : recognizer.stop(),
  );
} else {
  banner.hidden = false;
  toggleButton.disabled = true;
}

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || event.target === simulateInput) return;
  event.preventDefault();
  latency.markSpeechStart(Date.now());
});

simulateInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || !simulateInput.value.trim()) return;
  handleResult({ finalText: simulateInput.value, interimText: "", at: Date.now() });
  simulateInput.value = "";
});

renderLemmas();
