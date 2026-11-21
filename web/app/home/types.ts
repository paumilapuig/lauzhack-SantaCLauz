import type { WordToPractice } from "@/lib/student-contract";

export type MyWord = WordToPractice & { source: "class" | "home" };
