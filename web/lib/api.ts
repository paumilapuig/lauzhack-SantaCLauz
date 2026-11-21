export type Role = "student" | "teacher";

export type Me = { id: string; email: string; display_name: string | null; role: Role };

export type TokenProvider = () => Promise<string | null>;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createApiClient(
  baseUrl: string,
  getToken: TokenProvider,
  fetchImpl: typeof fetch = fetch,
) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    const token = await getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetchImpl(`${baseUrl}${path}`, { ...init, headers });
    if (!response.ok) {
      throw new ApiError(response.status, `${init.method ?? "GET"} ${path} failed with ${response.status}`);
    }
    return (await response.json()) as T;
  }

  return {
    request,
    getMe: () => request<Me>("/api/me"),
  };
}
