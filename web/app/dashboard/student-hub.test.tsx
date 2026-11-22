// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StudentHub } from "./student-hub";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));
afterEach(cleanup);

const lessons = [
  { id: "l-new", title: "La respiration cellulaire", subject: "Biologie", lesson_date: "2026-11-22" },
  { id: "l-old", title: "La photosynthèse", subject: null, lesson_date: null },
];

describe("StudentHub", () => {
  it("offers to start the class of each lesson", () => {
    render(<StudentHub email="lucia@demo" lessons={lessons} />);
    const links = screen.getAllByRole("link", { name: /Start the class/ });
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/class?lesson=l-new", "/class?lesson=l-old"]);
    expect(screen.getByText("La respiration cellulaire")).toBeTruthy();
  });

  it("explains when there is no lesson yet", () => {
    render(<StudentHub email="lucia@demo" lessons={[]} />);
    expect(screen.getByText(/No classes yet/)).toBeTruthy();
  });

  it("shows who is signed in and a way to sign out", () => {
    render(<StudentHub email="lucia@demo" lessons={lessons} />);
    expect(screen.getByText("lucia@demo")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeTruthy();
  });
});
