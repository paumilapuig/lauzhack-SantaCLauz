// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { snapToWords } from "./ranges"

function rangeIn(text: string, start: number, end: number) {
  const node = document.createTextNode(text)
  document.body.append(node)
  const range = document.createRange()
  range.setStart(node, start)
  range.setEnd(node, end)
  return range
}

describe("snapToWords", () => {
  const text = "La cellule utilise la nourriture pour avoir de l'énergie."

  it("a selection that cuts a word takes the whole word (seen in Chrome: 'la nourriture po')", () => {
    expect(snapToWords(rangeIn(text, 3, 35)).toString()).toBe("cellule utilise la nourriture pour")
    expect(snapToWords(rangeIn(text, 5, 18)).toString()).toBe("cellule utilise")
  })

  it("a selection on word edges stays as it is", () => {
    expect(snapToWords(rangeIn(text, 3, 10)).toString()).toBe("cellule")
  })
})
