import type { SafeResult } from "@asouei/safe-fetch";
import type { z } from "zod";
import type { FormErrors, SafeApiCall } from "@/types/api";

type ZodIssue = z.ZodError["issues"][number];

export const validateWith =
  <T>(schema: z.ZodType<T>) =>
  (raw: unknown) => {
    const r = schema.safeParse(raw);
    if (!r.success) {
      console.error("Validation failed:");
      console.error(raw);
      console.error(r.error);
    }
    return r.success ? { success: true as const, data: r.data } : { success: false as const, error: r.error };
  };

export const validateAndRequest = async <TInput, TOutput>(
  schema: z.ZodType<TInput>,
  input: unknown,
  request: (data: TInput) => Promise<SafeResult<TOutput>>,
): Promise<SafeApiCall<TOutput>> => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "validation",
      error: parsed.error,
    };
  }

  const response = await request(parsed.data);
  if (!response.ok) {
    return {
      ok: false,
      reason: "api",
      error: response,
    };
  }

  return { ok: true, data: response.data };
};

const extractParams = (issue: ZodIssue) => {
  switch (issue.code) {
    case "too_small":
      return { min: issue.minimum };
    case "too_big":
      return { max: issue.maximum };
    case "invalid_type":
      return { expected: issue.expected };
    case "invalid_format":
      return { format: issue.format, pattern: issue.pattern };
    case "not_multiple_of":
      return { divisor: issue.divisor };
    case "unrecognized_keys":
      return { keys: issue.keys.join(", ") };
    default:
      return undefined;
  }
};

export const parseZodError = (error: z.ZodError): FormErrors => {
  const errors: FormErrors = [];

  for (const issue of error.issues) {
    const field = (issue.path.join(".") || "_form").toLowerCase();
    errors.push({
      field,
      code: issue.code,
      params: extractParams(issue),
    });
  }

  return errors;
};
