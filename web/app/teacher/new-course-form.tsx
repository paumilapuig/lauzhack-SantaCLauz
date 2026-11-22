"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { teacherApi } from "./teacher-api-client";
import { createCourseErrorFr } from "./teacher-errors";

/** Create a course (e.g. "Biologie 1re") and open it to add its lessons. */
export function NewCourseForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("course_name"));
    setError(null);
    setPending(true);
    try {
      const course = await teacherApi.createCourse(name);
      form.reset();
      router.push(`/teacher/courses/${course.id}`);
    } catch (err) {
      setError(createCourseErrorFr(err instanceof ApiError ? err.status : 0));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      aria-labelledby="new-course"
      className="flex h-full min-h-52 flex-col gap-4 rounded-[24px] border-2 border-dashed border-input bg-card/60 p-5 md:p-6"
    >
      <h2 id="new-course" className="text-[18px] font-bold text-heading">New course</h2>
      <div className="flex flex-col gap-2">
        <Label htmlFor="course_name" className="text-[14px] font-bold text-heading">Name</Label>
        <Input
          id="course_name"
          name="course_name"
          required
          maxLength={80}
          placeholder="e.g. Biologie 1re"
          className="h-12 rounded-[12px] bg-card px-4 text-[16px]"
        />
      </div>
      {error ? <p role="alert" className="text-[15px] text-destructive">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-auto h-11 self-start rounded-full bg-heading px-5 text-[15px] font-bold text-primary-foreground transition-transform active:scale-[0.96] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Create course
      </button>
    </form>
  );
}
