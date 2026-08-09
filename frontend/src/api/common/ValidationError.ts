import z from "zod";

const issueFields = {
  field: z.string(),
};

const issueWithoutOptionsSchema = z.strictObject({
  ...issueFields,
  reason: z.literal([
    "required",
    "not-blank",
    "value.positive",
    "invalid",
    "format.digits-only",
    "format.uuid",
    "format.timestamp",
  ]),
});

const issueWithMinSchema = z.strictObject({
  ...issueFields,
  reason: z.literal(["length.min", "items.min", "value.min"]),
  min: z.number().int(),
});

const issueWithMaxSchema = z.strictObject({
  ...issueFields,
  reason: z.literal(["length.max", "items.max", "value.max"]),
  max: z.number().int(),
});

const issueWithRangeSchema = z.strictObject({
  ...issueFields,
  reason: z.literal(["length.between", "items.between"]),
  min: z.number().int(),
  max: z.number().int(),
});

const issueWithExactSchema = z.strictObject({
  ...issueFields,
  reason: z.literal(["length.exact", "items.exact"]),
  exact: z.number().int(),
});

const issueWithAllowedValuesSchema = z.strictObject({
  ...issueFields,
  reason: z.literal("value.one-of"),
  allowed: z.array(z.string()),
});

const expectedTypeSchema = z.enum(["string", "integer", "number", "boolean", "array", "object"]);
const issueWithExpectedTypeSchema = z.strictObject({
  ...issueFields,
  reason: z.literal("type.invalid"),
  expected: expectedTypeSchema,
});
export type ExpectedType = z.infer<typeof expectedTypeSchema>;

export const ValidationIssueSchema = z.discriminatedUnion("reason", [
  issueWithoutOptionsSchema,
  issueWithMinSchema,
  issueWithMaxSchema,
  issueWithRangeSchema,
  issueWithExactSchema,
  issueWithAllowedValuesSchema,
  issueWithExpectedTypeSchema,
]);

export const ValidationErrorSchema = z.strictObject({
  code: z.literal("validation.failed"),
  violations: z.array(ValidationIssueSchema),
});

export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
