// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TrueFalse } from "./true-false";
import { buildItems } from "./true-false-logic";

const words = [
  { lemma: "déchet", translation_es: "residuo", definition_fr: "Ce qu'on jette.", key_phrase: "Le déchet." },
  { lemma: "tri", translation_es: "separación", definition_fr: "Action de trier.", key_phrase: "Le tri." },
];

afterEach(cleanup);

describe("buildItems", () => {
  it("is deterministic and mixes true and false", () => {
    const items = buildItems(words, 1);
    expect(buildItems(words, 1)).toEqual(items);
    expect(items.some((i) => i.isTrue)).toBe(true);
    expect(items.some((i) => !i.isTrue)).toBe(true);
  });

  it("with 1 word only true items", () => {
    expect(buildItems(words.slice(0, 1), 1).every((i) => i.isTrue)).toBe(true);
  });
});

describe("TrueFalse", () => {
  it("answering correctly for every item passes all", () => {
    const onFinish = vi.fn();
    render(<TrueFalse words={words} onFinish={onFinish} onExit={vi.fn()} />);
    for (const item of buildItems(words, 1)) {
      fireEvent.click(screen.getByText(item.isTrue ? "True" : "False"));
      fireEvent.click(screen.getByText("Next"));
    }
    const results = onFinish.mock.calls[0][0];
    expect(results).toHaveLength(2);
    expect(results.every((r: { passed: boolean }) => r.passed)).toBe(true);
  });

  it("wrong answer fails the word and shows feedback", () => {
    const onFinish = vi.fn();
    render(<TrueFalse words={words.slice(0, 1)} onFinish={onFinish} onExit={vi.fn()} />);
    fireEvent.click(screen.getByText("False"));
    expect(screen.getByText("Not quite")).toBeTruthy();
    fireEvent.click(screen.getByText("Next"));
    expect(onFinish).toHaveBeenCalledWith([{ lemma: "déchet", passed: false }]);
  });
});
