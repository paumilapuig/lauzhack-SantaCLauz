// Chrome's built-in Translator API (on-device, Chrome 138+): no server and no LLM call.
// Not in TypeScript's DOM types yet, so the small part we use is typed here.
type TranslatorLike = { translate(text: string): Promise<string> }
type TranslatorApi = {
  availability(options: typeof OPTIONS): Promise<string>
  create(options: typeof OPTIONS): Promise<TranslatorLike>
}

const OPTIONS = { sourceLanguage: "fr", targetLanguage: "es" }
const WAIT_MS = 10_000 // the first time, Chrome may still be downloading the French model

let ready: Promise<TranslatorLike | null> | null = null

const api = () => (globalThis as { Translator?: TranslatorApi }).Translator

async function open(): Promise<TranslatorLike | null> {
  const Translator = api()
  if (!Translator) return null
  try {
    if ((await Translator.availability(OPTIONS)) === "unavailable") return null
    return await Translator.create(OPTIONS) // the first time Chrome downloads the French model
  } catch {
    return null
  }
}

/** Forget the translator (tests, or after the browser could not open one). */
export function resetTranslator() {
  ready = null
}

const STILL_OPENING = "still-opening"
const timeout = (ms: number) => new Promise<typeof STILL_OPENING>((resolve) => setTimeout(() => resolve(STILL_OPENING), ms))

/**
 * Start opening the translator now. Call it from a click (Chrome only downloads the model after a
 * user gesture), e.g. when she opens the Context tab, so the first word she taps is quick.
 */
export function prepareTranslator() {
  ready ??= open()
}

/** Spanish for a French word or sentence; null when this browser cannot translate (or not in time). */
export async function translateFrToEs(text: string, waitMs = WAIT_MS): Promise<string | null> {
  prepareTranslator()
  const translator = await Promise.race([ready!, timeout(waitMs)])
  if (translator === STILL_OPENING) return null // keep waiting for it: the next tap may be in time
  if (!translator) {
    resetTranslator()
    return null
  }
  try {
    return (await translator.translate(text)).trim() || null
  } catch {
    return null
  }
}
