import type { ExpectedType, ValidationIssue } from "@/api/common/ValidationError";

const localizeValidationField = (tSafe: any, field: string): string => {
  const path = field
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);
  if (path.length === 0) return field;
  const localizeSegment = (segment: string) => tSafe(`errors.validation.fields.${segment}`) ?? segment;
  const leaf: string = path[path.length - 1] ?? field;

  if (path.length === 1) return localizeSegment(leaf);

  const context: string[] = [];
  for (const segment of path.slice(0, -1)) {
    if (/^\d+$/.test(segment) && context.length > 0) {
      const index = tSafe("errors.validation.item-index", { index: Number(segment) + 1 }) ?? ` #${Number(segment) + 1}`;
      context[context.length - 1] += index;
    } else {
      context.push(localizeSegment(segment));
    }
  }

  return (
    tSafe("errors.validation.field-with-context", {
      field: localizeSegment(leaf),
      context: context.join(" > "),
    }) ?? `${localizeSegment(leaf)} (${context.join(" > ")})`
  );
};

const expectedTypeAliases: Record<ExpectedType, string> = {
  string: "string",
  integer: "integer",
  number: "number",
  boolean: "boolean",
  array: "array",
  object: "object",
};

export const formatValidationIssue = (tSafe: any, issue: ValidationIssue): string => {
  const params: Record<string, unknown> = {
    field: localizeValidationField(tSafe, issue.field),
  };

  switch (issue.reason) {
    case "length.min":
    case "items.min":
    case "value.min":
      params.min = issue.min;
      break;
    case "length.max":
    case "items.max":
    case "value.max":
      params.max = issue.max;
      break;
    case "length.between":
    case "items.between":
      params.min = issue.min;
      params.max = issue.max;
      break;
    case "length.exact":
    case "items.exact":
      params.exact = issue.exact;
      break;
    case "value.one-of":
      params.allowed = issue.allowed.join(", ");
      break;
    case "type.invalid": {
      const key: string = expectedTypeAliases[issue.expected];
      params.expected = tSafe(`errors.validation.types.${key}`) ?? issue.expected;
      break;
    }
  }

  return tSafe(`errors.validation.reasons.${issue.reason}`, params) ?? tSafe("errors.validation.invalid", params);
};

export const normalizeUsername = (username: string) => username.replace(/^@+/, "").trim();
export const isDigitOnlySequence = (value: string) => !value || /^\d+$/.test(value);
