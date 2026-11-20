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

  if (status.kind === "loading") return <p className="text-sm text-muted-foreground">Calling GET /api/me…</p>;
  if (status.kind === "error") {
    return <p data-testid="api-status" className="text-sm text-destructive">GET /api/me failed: {status.message}</p>;
  }
  return (
    <p data-testid="api-status" className="text-sm">
      GET /api/me → 200 OK (user id <code>{status.me.id}</code>)
    </p>
  );
}
