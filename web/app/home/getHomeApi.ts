import { api } from "@/lib/api-client";
import { apiMode } from "@/lib/apiMode";
import { createFakeHomeApi } from "./fakeHomeApi";
import { createHttpHomeApi, type HomeApi } from "./homeApi";

let fake: HomeApi | undefined;

/** Real API when NEXT_PUBLIC_CLASS_API=http, otherwise the in-browser demo data (kept for the whole visit). */
export function getHomeApi(): HomeApi {
  if (apiMode() === "http") return createHttpHomeApi(api.request);
  return (fake ??= createFakeHomeApi());
}
