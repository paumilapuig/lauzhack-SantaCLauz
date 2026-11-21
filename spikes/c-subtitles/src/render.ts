import type { Segment } from "./wordState";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

function renderSegment(seg: Segment): string {
  const text = escapeHtml(seg.text);
  if (seg.state === null) return text;
  const translation = seg.translationEs
    ? `<small class="tr">${escapeHtml(seg.translationEs)}</small>`
    : "";
  return `<span class="term term--${seg.state}" data-lemma="${escapeHtml(seg.lemma ?? "")}">${text}${translation}</span>`;
}

export function renderSegments(segments: Segment[]): string {
  return segments.map(renderSegment).join("");
}
