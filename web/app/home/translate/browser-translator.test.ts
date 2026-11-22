import { afterEach, describe, expect, it, vi } from "vitest"
import { prepareTranslator, resetTranslator, translateFrToEs } from "./browser-translator"

const g = globalThis as { Translator?: unknown }

function fakeTranslator(availability: string, translate = async (t: string) => `es:${t}`) {
  const create = vi.fn(async () => ({ translate }))
  g.Translator = { availability: vi.fn(async () => availability), create }
  return create
}

afterEach(() => {
  delete g.Translator
  resetTranslator()
})

describe("translateFrToEs (Chrome's built-in translator, no server, no LLM)", () => {
  it("translates French into Spanish", async () => {
    fakeTranslator("available")
    expect(await translateFrToEs("la cellule")).toBe("es:la cellule")
  })

  it("creates the translator once and reuses it", async () => {
    const create = fakeTranslator("downloadable")
    await translateFrToEs("un")
    await translateFrToEs("deux")
    expect(create).toHaveBeenCalledTimes(1)
    expect(create).toHaveBeenCalledWith({ sourceLanguage: "fr", targetLanguage: "es" })
  })

  it("gives null when the browser has no translator, or cannot translate French", async () => {
    expect(await translateFrToEs("bonjour")).toBeNull()
    fakeTranslator("unavailable")
    resetTranslator()
    expect(await translateFrToEs("bonjour")).toBeNull()
  })

  it("gives null when a translation fails, and tries again next time", async () => {
    let fail = true
    fakeTranslator("available", async (t) => {
      if (fail) throw new Error("offline")
      return `es:${t}`
    })
    expect(await translateFrToEs("eau")).toBeNull()
    fail = false
    expect(await translateFrToEs("eau")).toBe("es:eau")
  })

  it("while Chrome is still downloading the model it gives null in time, and the same translator answers later", async () => {
    let open: (t: { translate: (s: string) => Promise<string> }) => void = () => {}
    const create = vi.fn(() => new Promise((resolve) => (open = resolve)))
    g.Translator = { availability: async () => "downloadable", create }
    expect(await translateFrToEs("eau", 5)).toBeNull()
    open({ translate: async (t) => `es:${t}` })
    expect(await translateFrToEs("eau", 5)).toBe("es:eau")
    expect(create).toHaveBeenCalledTimes(1)
  })

  it("prepareTranslator starts opening it before the first tap", async () => {
    const create = fakeTranslator("downloadable")
    prepareTranslator()
    await vi.waitFor(() => expect(create).toHaveBeenCalledTimes(1))
  })
})
