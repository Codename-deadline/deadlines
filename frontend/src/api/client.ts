import type { SafeFetchRequest, SafeResult } from "@asouei/safe-fetch";
import { ApiRequestError, toLegacyApiError } from "./errors";
import { request } from "./transport";

type LegacyOptions<T> = Omit<SafeFetchRequest<T>, "timeoutMs" | "totalTimeoutMs" | "retries" | "parseAs"> & {
  parseAs?: "json" | "blob";
};

/** Compatibility only: keep existing schemas/results while sharing the new transport. */
async function legacyRequest<T>(url: string, options: LegacyOptions<T> = {}): Promise<SafeResult<T>> {
  const { body, query, validate, parseAs = "json", ...init } = options;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.set(key, String(value));
    }
    url += `${url.includes("?") ? "&" : "?"}${params}`;
  }
  const headers = new Headers(init.headers);
  const jsonBody =
    body != null &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(body);
  if (jsonBody && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  try {
    const result = await request<T>(
      url,
      {
        ...init,
        headers,
        body: jsonBody ? JSON.stringify(body) : (body as BodyInit | null | undefined),
      },
      parseAs,
    );
    if (validate) {
      const parsed = validate(result.data);
      if (!parsed.success) {
        throw ApiRequestError.validation("Response validation failed", {
          response: result.response,
          body: result.data,
          cause: parsed.error,
        });
      }
      return { ok: true, data: parsed.data, response: result.response };
    }
    return { ok: true, ...result };
  } catch (error) {
    return toLegacyApiError(error);
  }
}

export const client = {
  get: <T = unknown>(url: string, options?: LegacyOptions<T>) => legacyRequest<T>(url, { ...options, method: "GET" }),
  delete: <T = unknown>(url: string, options?: LegacyOptions<T>) =>
    legacyRequest<T>(url, { ...options, method: "DELETE" }),
  post: <T = unknown>(url: string, body?: unknown, options?: LegacyOptions<T>) =>
    legacyRequest<T>(url, { ...options, method: "POST", body: body as SafeFetchRequest<T>["body"] }),
  put: <T = unknown>(url: string, body?: unknown, options?: LegacyOptions<T>) =>
    legacyRequest<T>(url, { ...options, method: "PUT", body: body as SafeFetchRequest<T>["body"] }),
  patch: <T = unknown>(url: string, body?: unknown, options?: LegacyOptions<T>) =>
    legacyRequest<T>(url, { ...options, method: "PATCH", body: body as SafeFetchRequest<T>["body"] }),
};
