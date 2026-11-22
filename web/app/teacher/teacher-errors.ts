const SESSION_EXPIRED = "Session expirée, reconnectez-vous.";
const UNREACHABLE = "Serveur injoignable.";

const CREATE_LESSON_ERRORS: Record<number, string> = {
  401: SESSION_EXPIRED,
  403: "Réservé aux enseignants.",
  413: "Fichier trop lourd (10 Mo maximum).",
  415: "Format non accepté : txt, PDF, PNG ou JPG.",
  422: "Il manque un champ, ou le texte/fichier est vide ou illisible.",
  500: "Impossible d'enregistrer la leçon. Réessayez.",
  502: "L'IA n'a pas pu préparer le glossaire. Réessayez.",
  503: "L'IA n'est pas configurée sur le serveur.",
  0: UNREACHABLE,
};

const LOAD_ERRORS: Record<number, string> = {
  401: SESSION_EXPIRED,
  403: "Cette leçon n'est pas la vôtre.",
  404: "Leçon introuvable",
  0: UNREACHABLE,
};

const unexpected = (status: number) => `Erreur inattendue (code ${status}).`;

export const createLessonErrorFr = (status: number): string =>
  CREATE_LESSON_ERRORS[status] ?? unexpected(status);

export const loadErrorFr = (status: number): string =>
  LOAD_ERRORS[status] ?? unexpected(status);
