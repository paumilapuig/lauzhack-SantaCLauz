import { describe, expect, it, vi } from "vitest";
import { announceResult } from "./savedToast";

function fakeToast() {
  return { success: vi.fn(), error: vi.fn() };
}

describe("announceResult", () => {
  it("pops a French success message for a saved clip", () => {
    const toast = fakeToast();
    announceResult(toast, "onUnclear", "saved");
    expect(toast.success).toHaveBeenCalledWith("Extrait enregistré", expect.any(Object));
  });

  it("pops a French success message for a saved lost moment", () => {
    const toast = fakeToast();
    announceResult(toast, "onLost", "saved");
    expect(toast.success).toHaveBeenCalledWith("Moment enregistré", expect.any(Object));
  });

  it("pops a French message when the class is ended", () => {
    const toast = fakeToast();
    announceResult(toast, "onEnd", "saved");
    expect(toast.success).toHaveBeenCalledWith("Cours terminé", expect.any(Object));
  });

  it("pops an error when saving failed", () => {
    const toast = fakeToast();
    announceResult(toast, "onLost", "failed");
    expect(toast.error).toHaveBeenCalledWith("Pas pu enregistrer", expect.any(Object));
  });

  it("stays silent for an ignored double press", () => {
    const toast = fakeToast();
    announceResult(toast, "onUnclear", "ignored");
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
