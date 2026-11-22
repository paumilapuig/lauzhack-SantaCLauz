// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClassActionButton } from "./ClassActionButton";

afterEach(cleanup);

describe("ClassActionButton", () => {
  it("shows the French label of each action", () => {
    render(<ClassActionButton action="unclear" onPress={() => {}} />);
    render(<ClassActionButton action="lost" onPress={() => {}} />);
    expect(screen.getByRole("button", { name: "Je n'ai pas compris" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "J'ai perdu le fil" })).toBeTruthy();
  });

  it("calls onPress when clicked", () => {
    const onPress = vi.fn();
    render(<ClassActionButton action="lost" onPress={onPress} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
