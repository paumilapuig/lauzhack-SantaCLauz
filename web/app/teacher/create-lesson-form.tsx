"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateLessonFile } from "./lesson-file";
import { teacherApi } from "./teacher-api-client";
import { createLessonErrorFr } from "./teacher-errors";

type SourceMode = "text" | "file";

const todayIso = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const TEXTAREA_CLASS =
  "min-h-44 w-full rounded-[16px] border border-input bg-card px-4 py-3 text-[16px] text-foreground outline-none placeholder:text-subtle focus-visible:border-heading focus-visible:ring-2 focus-visible:ring-heading/15";

const MODES: { id: SourceMode; label: string }[] = [
  { id: "text", label: "Paste the text" },
  { id: "file", label: "Upload a file" },
];

function TextField({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name} className="text-[14px] font-bold text-heading">{label}</Label>
      <Input id={name} name={name} type={type} required defaultValue={type === "date" ? todayIso() : undefined} className="h-12 rounded-[12px] bg-card px-4 text-[16px]" />
    </div>
  );
}

export function CreateLessonForm() {
  const router = useRouter();
  const [mode, setMode] = useState<SourceMode>("text");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0] ?? null;
    setFile(chosen);
    setFileError(chosen ? validateLessonFile(chosen) : null);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fields = {
      title: String(data.get("title")),
      subject: String(data.get("subject")),
      lesson_date: String(data.get("lesson_date")),
    };
    setSubmitError(null);
    setPending(true);
    try {
      const created =
        mode === "file" && file
          ? await teacherApi.createLessonFromFile(fields, file)
          : await teacherApi.createLessonFromText(fields, String(data.get("source_text")));
      router.push(`/teacher/lessons/${created.lesson_id}`);
    } catch (err) {
      setSubmitError(createLessonErrorFr(err instanceof ApiError ? err.status : 0));
      setPending(false);
    }
  }

  const blocked = pending || (mode === "file" && (!file || fileError !== null));

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <TextField name="title" label="Title" />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="subject" label="Subject" />
        <TextField name="lesson_date" label="Date" type="date" />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-[14px] font-bold text-heading">Lesson source</legend>
        <div className="grid w-full max-w-[360px] grid-cols-2 rounded-full border border-border bg-card p-1">
          {MODES.map(({ id, label }) => (
            <label
              key={id}
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center rounded-full text-[14px] font-bold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
                mode === id ? "bg-heading text-primary-foreground" : "text-label-secondary hover:text-heading",
              )}
            >
              <input type="radio" name="mode" className="sr-only" checked={mode === id} onChange={() => setMode(id)} />
              {label}
            </label>
          ))}
        </div>
        {mode === "text" ? (
          <textarea
            name="source_text"
            required
            aria-label="Lesson text"
            placeholder="Paste your lesson notes in French. Loop'd picks the words that may block a newcomer."
            className={TEXTAREA_CLASS}
          />
        ) : (
          <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-input bg-card p-6 text-center hover:border-input-hover has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary">
            <FileUp aria-hidden className="size-7 text-brand-orange" />
            <span className="text-[16px] font-bold text-heading">{file ? file.name : "Choose a file"}</span>
            <span className="text-[14px] text-label-secondary">Text, PDF or a photo of the board</span>
            <input
              type="file"
              name="file"
              required
              aria-label="Lesson file"
              accept=".txt,.pdf,.png,.jpg,.jpeg"
              onChange={onFileChange}
              className="sr-only"
            />
          </label>
        )}
        {fileError && mode === "file" ? <p role="alert" className="text-[15px] text-destructive">{fileError}</p> : null}
      </fieldset>

      {submitError ? <p role="alert" className="text-[15px] text-destructive">{submitError}</p> : null}
      <p aria-live="polite" className="text-[15px] text-label-secondary">
        {pending ? "Preparing the glossary… (a few seconds)" : ""}
      </p>
      <button
        type="submit"
        disabled={blocked}
        className="h-12 self-start rounded-full bg-heading px-6 text-[16px] font-bold text-primary-foreground transition-transform active:scale-[0.96] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Create lesson
      </button>
    </form>
  );
}
