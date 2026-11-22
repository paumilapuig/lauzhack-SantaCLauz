"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { ApiError, type Me } from "@/lib/api";

type Status =
  | { kind: "loading" }
  | { kind: "ok"; me: Me }
  | { kind: "error"; message: string };

export function ApiStatus() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    api
      .getMe()
      .then((me) => setStatus({ kind: "ok", me }))
      .catch((error: unknown) => {
        const message = error instanceof ApiError ? `HTTP ${error.status}` : "API unreachable";
        setStatus({ kind: "error", message });
      });
  }, []);

  if (status.kind === "loading") return <p className="text-sm">Checking the server…</p>;
  if (status.kind === "error") {
    return (
      <p data-testid="api-status" className="text-sm font-medium text-word-orange">
        Server not available ({status.message}). Start the API: <code>uv run fastapi dev app/main.py</code>
      </p>
    );
  }
  return (
    <p data-testid="api-status" className="text-sm">
      Server connected
    </p>
  );
}
