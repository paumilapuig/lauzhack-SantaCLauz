// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Flashcards } from "./flashcards";
import { recordAnswer } from "./flashcards-logic";

const words = [
  { lemma: "déchet", translation_es: "residuo", definition_fr: "Ce qu'on jette.", key_phrase: "Le déchet." },
  { lemma: "tri", translation_es: "separación", definition_fr: "Action de trier.", key_phrase: "Le tri." },
];

afterEach(cleanup);

describe("Flashcards", () => {
  it("flip reveals the Spanish translation", () => {
    render(<Flashcards words={words} onFinish={vi.fn()} onExit={vi.fn()} />);
    expect(screen.queryByText("residuo")).toBeNull();
    fireEvent.click(screen.getByText("déchet"));
    expect(screen.getByText("residuo")).toBeTruthy();
  });

  it("'Not yet' gives passed false in onFinish", () => {
    const onFinish = vi.fn();
    render(<Flashcards words={words} onFinish={onFinish} onExit={vi.fn()} />);
    fireEvent.click(screen.getByText("déchet"));
    fireEvent.click(screen.getByText("Not yet"));
    fireEvent.click(screen.getByText("tri"));
    fireEvent.click(screen.getByText("I knew it"));
    expect(onFinish).toHaveBeenCalledWith([
      { lemma: "déchet", passed: false },
      { lemma: "tri", passed: true },
    ]);
    expect(screen.getByText("Done")).toBeTruthy();
  });

  it("recordAnswer appends", () => {
    expect(recordAnswer([], "a", true)).toEqual([{ lemma: "a", passed: true }]);
  });
});
