import { describe, expect, it, vi } from "vitest";
import { ApiError, createApiClient, type Me } from "./api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createApiClient", () => {
  it("attaches the Supabase access token as a Bearer header", async () => {
    const expectedMe: Me = { id: "u1", email: "a@b.c", display_name: "lucia-w1", role: "student" };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(expectedMe));
    const client = createApiClient("http://api.test", async () => "tok123", fetchMock);

    const me = await client.getMe();

    expect(me).toEqual(expectedMe);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/me");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok123");
  });

  it("sends no Authorization header when there is no session", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = createApiClient("http://api.test", async () => null, fetchMock);

    await client.request("/health");

    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init.headers).has("Authorization")).toBe(false);
  });

  it("throws ApiError with the HTTP status on failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ detail: "no" }, 401));
    const client = createApiClient("http://api.test", async () => null, fetchMock);

    await expect(client.getMe()).rejects.toMatchObject({ status: 401, name: "ApiError" });
    await expect(client.getMe()).rejects.toBeInstanceOf(ApiError);
  });
});
