// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { OrderPhrase } from "./order-phrase";
import { isRebuilt, phraseChips } from "./order-phrase-logic";

const words = [
  { lemma: "tri", translation_es: "separación", definition_fr: "Action de trier.", key_phrase: "Le tri aide" },
  { lemma: "déchet", translation_es: "residuo", definition_fr: "Ce qu'on jette.", key_phrase: "Un déchet reste" },
];

afterEach(cleanup);

function tap(...texts: string[]) {
  texts.forEach((text) => fireEvent.click(screen.getByRole("button", { name: text })));
}

describe("OrderPhrase", () => {
  it("chips are the words of the phrase", () => {
    render(<OrderPhrase words={words} onFinish={vi.fn()} onExit={vi.fn()} />);
    ["Le", "tri", "aide"].forEach((t) => expect(screen.getByRole("button", { name: t })).toBeTruthy());
  });

  it("correct order moves to the next item, then finishes", () => {
    const onFinish = vi.fn();
    render(<OrderPhrase words={words} onFinish={onFinish} onExit={vi.fn()} />);
    tap("Le", "tri", "aide");
    expect(screen.getByRole("button", { name: "déchet" })).toBeTruthy();
    tap("Un", "déchet", "reste");
    expect(onFinish).toHaveBeenCalledWith([
      { lemma: "tri", passed: true },
      { lemma: "déchet", passed: true },
    ]);
  });

  it("a wrong order resets the chips and gives passed false", () => {
    const onFinish = vi.fn();
    render(<OrderPhrase words={[words[0]]} onFinish={onFinish} onExit={vi.fn()} />);
    tap("aide", "tri", "Le");
    expect(onFinish).not.toHaveBeenCalled();
    tap("Le", "tri", "aide");
    expect(onFinish).toHaveBeenCalledWith([{ lemma: "tri", passed: false }]);
  });

  it("isRebuilt compares text in order", () => {
    const chips = phraseChips("a b");
    expect(isRebuilt(chips, [chips[0], chips[1]])).toBe(true);
    expect(isRebuilt(chips, [chips[1], chips[0]])).toBe(false);
  });
});
