import { describe, expect, it } from "vitest";
import { createLessonErrorFr, loadErrorFr } from "./teacher-errors";

describe("createLessonErrorFr", () => {
  it.each([
    [401, "Session expirée, reconnectez-vous."],
    [403, "Réservé aux enseignants."],
    [413, "Fichier trop lourd (10 Mo maximum)."],
    [415, "Format non accepté : txt, PDF, PNG ou JPG."],
    [422, "Il manque un champ, ou le texte/fichier est vide ou illisible."],
    [502, "L'IA n'a pas pu préparer le glossaire. Réessayez."],
    [503, "L'IA n'est pas configurée sur le serveur."],
    [500, "Impossible d'enregistrer la leçon. Réessayez."],
    [0, "Serveur injoignable."],
    [418, "Erreur inattendue (code 418)."],
  ])("maps %i", (status, text) => {
    expect(createLessonErrorFr(status)).toBe(text);
  });
});

describe("loadErrorFr", () => {
  it.each([
    [401, "Session expirée, reconnectez-vous."],
    [403, "Cette leçon n'est pas la vôtre."],
    [404, "Leçon introuvable"],
    [0, "Serveur injoignable."],
    [418, "Erreur inattendue (code 418)."],
  ])("maps %i", (status, text) => {
    expect(loadErrorFr(status)).toBe(text);
  });
});
