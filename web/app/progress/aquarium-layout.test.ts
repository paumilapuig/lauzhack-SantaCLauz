import { describe, expect, it } from "vitest"
import { arrangeTank, MAX_IN_TANK, speciesOf, stageOf } from "./aquarium-layout"

const word = (lemma: string, level: number) => ({ lemma, translation_es: `es-${lemma}`, level })

describe("speciesOf", () => {
  it("always gives the same animal to the same word", () => {
    expect(speciesOf("déchet")).toBe(speciesOf("déchet"))
  })

  it("uses several species across words", () => {
    const species = new Set(["déchet", "chaleur", "glucose", "oxygène", "cellule", "énergie", "muscle", "sang"].map(speciesOf))
    expect(species.size).toBeGreaterThanOrEqual(3)
  })
})

describe("stageOf", () => {
  it("names the four evolutions", () => {
    expect([0, 1, 2, 3].map(stageOf)).toEqual(["an egg", "a baby", "grown", "fully grown"])
    expect(stageOf(9)).toBe("fully grown")
    expect(stageOf(-1)).toBe("an egg")
  })
})

describe("arrangeTank", () => {
  it("puts every word in the tank when there are few", () => {
    const tank = arrangeTank([word("a", 0), word("b", 2)])
    expect(tank.inTank.map((c) => c.word.lemma).sort()).toEqual(["a", "b"])
    expect(tank.outside).toEqual([])
  })

  it(`never puts more than ${MAX_IN_TANK} animals in the tank`, () => {
    const many = Array.from({ length: 30 }, (_, i) => word(`w${i}`, i % 4))
    const tank = arrangeTank(many)
    expect(tank.inTank).toHaveLength(MAX_IN_TANK)
    expect(tank.outside).toHaveLength(30 - MAX_IN_TANK)
  })

  it("keeps room for words still growing even when many are learned", () => {
    const many = [...Array.from({ length: 20 }, (_, i) => word(`g${i}`, 3)), word("new1", 0), word("new2", 1)]
    const levels = arrangeTank(many).inTank.map((c) => c.word.level)
    expect(levels.filter((l) => l < 2).length).toBeGreaterThanOrEqual(2)
  })

  it("eggs and starfish rest on the sand, the rest swim", () => {
    const tank = arrangeTank(["déchet", "chaleur", "glucose", "oxygène", "cellule", "énergie"].map((l, i) => word(l, i % 4)))
    for (const c of tank.inTank) {
      const onSand = c.word.level <= 0 || c.species === "starfish"
      expect(c.y >= 75).toBe(onSand)
    }
  })

  it("places animals inside the tank and not on top of each other in a row", () => {
    const tank = arrangeTank(Array.from({ length: MAX_IN_TANK }, (_, i) => word(`w${i}`, 2)))
    for (const c of tank.inTank) {
      expect(c.x).toBeGreaterThan(0)
      expect(c.x).toBeLessThan(100)
    }
    const keys = tank.inTank.map((c) => `${Math.round(c.x)}-${Math.round(c.y)}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
