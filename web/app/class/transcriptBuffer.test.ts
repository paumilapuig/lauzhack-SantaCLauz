import { describe, expect, it } from "vitest";
import { createTranscriptBuffer } from "./transcriptBuffer";

describe("createTranscriptBuffer", () => {
  it("joins segments in order with single spaces", () => {
    const buffer = createTranscriptBuffer({ keepSec: 90 });
    buffer.add("bonjour", 1);
    buffer.add("la classe", 5);
    buffer.add("commence", 9);
    expect(buffer.textBetween(0, 10)).toBe("bonjour la classe commence");
  });

  it("includes both boundaries", () => {
    const buffer = createTranscriptBuffer({ keepSec: 90 });
    buffer.add("a", 1);
    buffer.add("b", 2);
    buffer.add("c", 3);
    expect(buffer.textBetween(1, 3)).toBe("a b c");
    expect(buffer.textBetween(2, 2)).toBe("b");
  });

  it("returns an empty string for an empty range", () => {
    const buffer = createTranscriptBuffer({ keepSec: 90 });
    buffer.add("a", 1);
    expect(buffer.textBetween(5, 10)).toBe("");
    expect(createTranscriptBuffer({ keepSec: 90 }).textBetween(0, 10)).toBe("");
  });

  it("prunes entries older than keepSec", () => {
    const buffer = createTranscriptBuffer({ keepSec: 90 });
    buffer.add("old", 5);
    buffer.add("edge", 10);
    buffer.add("new", 100);
    buffer.prune(100);
    expect(buffer.textBetween(0, 200)).toBe("edge new");
  });
  it("replaces the last entry when Chrome sends a revised version of the same sentence", () => {
    const buffer = createTranscriptBuffer({ keepSec: 90 });
    buffer.add("aujourd hui je suis très Jol", 10);
    buffer.add("aujourd hui je suis très jolie de la", 12);
    buffer.add("cette réaction libère", 15);
    expect(buffer.textBetween(0, 20)).toBe("aujourd hui je suis très jolie de la cette réaction libère");
    expect(buffer.textBetween(0, 11)).toBe("aujourd hui je suis très jolie de la");
  });
  it("keeps one clean sentence for the real repeated clip saved on Sun 22 Nov 02:11", () => {
    const saved = "aujourd hui je suis très Jol aujourd hui je suis très jolie de la aujourd hui je suis très jolie et la aujourd hui je suis très jolie de la RA aujourd hui je suis très jolie de la raqu aujourd hui je suis très jolie de la raquette et aujourd hui je suis très jolie de la raquette Tom et an aujourd hui je suis très jolie de la raquette et an aujourd hui je suis très jolie de la raquette et annec aujourd hui je suis très jolie de la raquette et Annecy ferm aujourd hui je suis très jolie de la raquette et Annecy fermer les class aujourd hui je suis très jolie de la raquette et Annecy fermer les classes en aujourd hui je suis très jolie de la raquette et Annecy fermer les classes Antoine aujourd hui je suis très jolie de la raquette et Annecy fermer les classes en train de aujourd hui je suis très jolie de la raquette et Annecy fermer les classes Antoine d aujourd hui aujourd hui je suis très jolie de la raquette et Annecy fermer les classes en train de aujourd hui à Michael de aujourd hui je suis très jolie de la raquette et Annecy fermer les classes en train de aujourd hui à Michael je suis aujourd hui je suis très jolie de la raquette et Annecy fermer les classes en train de aujourd hui à Michael de suite aujourd hui je suis très jolie de la raquette et Annecy fermer les classes en train de aujourd hui à Michael je suis très jolie il";
    const finals = saved.split(/(?=aujourd hui je suis)/).map((piece) => piece.trim());
    const buffer = createTranscriptBuffer({ keepSec: 90 });
    finals.forEach((text, i) => buffer.add(text, i));
    expect(buffer.textBetween(0, 100)).toBe(finals.at(-1));
  });

  it("a clip taken while the teacher is still talking keeps the sentence being heard (bug Sun 22 Nov 08:32)", () => {
    const buffer = createTranscriptBuffer({ keepSec: 90 });
    buffer.add("bonjour à tous", 30);
    buffer.hear("la mitochondrie transforme", 44);
    buffer.hear("la mitochondrie transforme le glucose", 52);
    expect(buffer.textBetween(44, 57)).toBe("la mitochondrie transforme le glucose");
  });

  it("a sentence that started before the clip and ended inside it belongs to the clip", () => {
    const buffer = createTranscriptBuffer({ keepSec: 90 });
    buffer.hear("elle produit", 40);
    buffer.add("elle produit aussi des déchets", 60);
    expect(buffer.textBetween(44, 57)).toBe("elle produit aussi des déchets");
    expect(buffer.textBetween(61, 70)).toBe("");
  });

  it("a final result clears the sentence being heard", () => {
    const buffer = createTranscriptBuffer({ keepSec: 90 });
    buffer.hear("le sang", 10);
    buffer.add("le sang transporte", 12);
    buffer.hear("", 12);
    expect(buffer.textBetween(0, 20)).toBe("le sang transporte");
  });
});
