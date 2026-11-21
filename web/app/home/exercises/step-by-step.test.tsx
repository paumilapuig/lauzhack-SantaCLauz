// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StepByStep } from "./step-by-step";

const flow = vi.hoisted(() => ({ words: [] as { lemma: string; level: number; clip_id: null }[] }));

vi.mock("../practice-flow", () => ({
  PracticeFlow: ({ word, onDone }: { word: { lemma: string; level: number; clip_id: null }; onDone: (l: string) => void }) => {
    flow.words.push(word);
    return <button onClick={() => onDone(word.lemma)}>done {word.lemma}</button>;
  },
}));

const words = [
  { lemma: "déchet", translation_es: "residuo", definition_fr: "d", key_phrase: "k" },
  { lemma: "tri", translation_es: "separación", definition_fr: "d", key_phrase: "k" },
];

afterEach(cleanup);

describe("StepByStep", () => {
  it("runs PracticeFlow per word and calls onFinish([]) after the last", () => {
    const onFinish = vi.fn();
    render(<StepByStep words={words} onFinish={onFinish} onExit={vi.fn()} />);
    fireEvent.click(screen.getByText("done déchet"));
    expect(onFinish).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("done tri"));
    expect(onFinish).toHaveBeenCalledWith([]);
    expect(flow.words[0]).toMatchObject({ lemma: "déchet", level: 0, clip_id: null });
  });
});
