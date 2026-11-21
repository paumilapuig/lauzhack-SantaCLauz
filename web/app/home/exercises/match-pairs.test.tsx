// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { buildBoard, buildResults, isPair } from "./match-pairs-logic";
import { MatchPairs } from "./match-pairs";

const words = ["a", "b", "c", "d", "e"].map((l) => ({ lemma: l, translation_es: `${l}-es`, definition_fr: "", key_phrase: "" }));

describe("match pairs logic", () => {
  it("isPair compares lemmas", () => {
    expect(isPair("a", "a")).toBe(true);
    expect(isPair("a", "b")).toBe(false);
  });
  it("board has at most 4 pairs per column", () => {
    const board = buildBoard(words, 1);
    expect(board.french).toHaveLength(4);
    expect(board.spanish).toHaveLength(4);
  });
  it("a pair wrong once is not passed", () => {
    expect(buildResults(["a", "b"], new Set(["a"]))).toEqual([
      { lemma: "a", passed: false },
      { lemma: "b", passed: true },
    ]);
  });
});

afterEach(cleanup);

describe("MatchPairs", () => {
  it("wrong then right finishes with the failed lemma", () => {
    vi.useFakeTimers();
    const onFinish = vi.fn();
    const two = words.slice(0, 2);
    render(<MatchPairs words={two} onFinish={onFinish} onExit={() => {}} />);
    fireEvent.click(screen.getByText("a"));
    fireEvent.click(screen.getByText("b-es"));
    act(() => void vi.advanceTimersByTime(700));
    fireEvent.click(screen.getByText("a"));
    fireEvent.click(screen.getByText("a-es"));
    fireEvent.click(screen.getByText("b"));
    fireEvent.click(screen.getByText("b-es"));
    expect(onFinish).toHaveBeenCalledWith(
      expect.arrayContaining([
        { lemma: "a", passed: false },
        { lemma: "b", passed: false },
      ]),
    );
    vi.useRealTimers();
  });
});
