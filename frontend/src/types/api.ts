import type { NormalizedError } from "@asouei/safe-fetch";
import type z from "zod";

export enum AuthMethod {
  TELEGRAM = "TELEGRAM",
}

export type FieldError = {
  field: string;
  code: string;
  params?: Record<string, unknown>;
};

export type FormErrors = FieldError[];

export type ApiError = { ok: false; error: NormalizedError; response?: Response };

export type SafeApiCall<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "validation"; error: z.ZodError }
  | {
      ok: false;
      reason: "api";
      error: {
        ok: false;
        error: NormalizedError;
        response?: Response;
      };
    };
