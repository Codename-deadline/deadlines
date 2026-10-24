import type { ApiError } from "@/types/api";
import { HTTP_STATUS } from "./http-status";

export type ApiRequestErrorOptions = {
  response?: Response;
  body?: unknown;
  timeoutMs?: number;
  cause?: unknown;
};

export class ApiRequestError extends Error {
  readonly response?: Response;
  readonly body?: unknown;
  readonly timeoutMs: number;
  readonly cause?: unknown;

  constructor(
    public readonly name: "HttpError" | "NetworkError" | "TimeoutError" | "ValidationError",
    message: string,
    options: ApiRequestErrorOptions = {},
  ) {
    super(message);
    this.response = options.response;
    this.body = options.body;
    this.timeoutMs = options.timeoutMs ?? 0;
    this.cause = options.cause;
  }

  static http(response: Response, options: Omit<ApiRequestErrorOptions, "response" | "timeoutMs"> = {}) {
    return new ApiRequestError("HttpError", `HTTP ${response.status}`, { ...options, response });
  }

  static network(cause?: unknown) {
    return new ApiRequestError("NetworkError", "Network request failed", { cause });
  }

  static timeout(timeoutMs: number, cause?: unknown) {
    return new ApiRequestError("TimeoutError", "Request timed out", { timeoutMs, cause });
  }

  static validation(message: string, options: Omit<ApiRequestErrorOptions, "timeoutMs"> = {}) {
    return new ApiRequestError("ValidationError", message, options);
  }

  get isTransient(): boolean {
    return (
      this.name === "NetworkError" ||
      this.name === "TimeoutError" ||
      this.status === HTTP_STATUS.TOO_MANY_REQUESTS ||
      (this.status !== undefined && this.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR)
    );
  }

  get status() {
    return this.response?.status;
  }

  get statusText() {
    return this.response?.statusText ?? "";
  }
}

export function isCancellation(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || ("cause" in error && isCancellation(error.cause)));
}

/** Temporary bridge for the existing notification helpers and SafeApiCall. */
export function toLegacyApiError(error: unknown): ApiError {
  if (error instanceof ApiRequestError) {
    return { ok: false, error: error as ApiError["error"], response: error.response };
  }
  return { ok: false, error: { name: "NetworkError", message: "Network request failed", cause: error } };
}
